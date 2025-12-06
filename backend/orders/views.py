from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from django.conf import settings
from django.shortcuts import redirect
from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
    OrderUpdateStatusSerializer
)
from .vnpay import VNPay
from .momo import MoMo


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet cho Order"""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def get_permissions(self):
        """Phân quyền"""
        if self.action in ['create', 'create_vnpay_payment', 'vnpay_return', 'create_momo_payment', 'momo_return', 'momo_ipn']:
            # Cho phép tạo đơn hàng và thanh toán không cần đăng nhập (guest checkout)
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Lọc queryset theo user"""
        user = self.request.user
        
        if not user.is_authenticated:
            return Order.objects.none()
        
        # Admin có thể xem tất cả đơn hàng
        if user.role == 'admin':
            return Order.objects.all().prefetch_related('items', 'items__product')
        
        # User chỉ xem được đơn hàng của mình
        return Order.objects.filter(
            Q(user=user) | Q(email=user.email)
        ).prefetch_related('items', 'items__product')
    
    def get_serializer_class(self):
        """Chọn serializer phù hợp"""
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action == 'update_status':
            return OrderUpdateStatusSerializer
        return OrderSerializer
    
    def create(self, request, *args, **kwargs):
        """Tạo đơn hàng mới"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order = serializer.save()
        
        # Serialize order để trả về
        order_serializer = OrderSerializer(order)
        
        return Response(
            {
                'message': 'Đặt hàng thành công',
                'order': order_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        """Lấy danh sách đơn hàng"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Lọc theo trạng thái nếu có
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Lọc theo phương thức thanh toán nếu có
        payment_method = request.query_params.get('payment_method', None)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Phân trang
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Lấy chi tiết đơn hàng"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Cập nhật trạng thái đơn hàng"""
        order = self.get_object()
        
        # Chỉ admin mới có thể cập nhật trạng thái
        if request.user.role != 'admin':
            return Response(
                {'error': 'Bạn không có quyền cập nhật trạng thái đơn hàng'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(
            order,
            data=request.data,
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Trả về order đã cập nhật
        order_serializer = OrderSerializer(order)
        return Response(
            {
                'message': 'Cập nhật trạng thái thành công',
                'order': order_serializer.data
            }
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """Hủy đơn hàng"""
        order = self.get_object()
        
        # Kiểm tra quyền: user chỉ có thể hủy đơn hàng của mình
        if request.user.role != 'admin' and order.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền hủy đơn hàng này'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Chỉ có thể hủy đơn hàng ở trạng thái pending hoặc confirmed
        if order.status not in ['pending', 'confirmed']:
            return Response(
                {'error': f'Không thể hủy đơn hàng ở trạng thái {order.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Hủy đơn hàng
        serializer = OrderUpdateStatusSerializer(
            order,
            data={'status': 'cancelled'},
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Trả về order đã hủy
        order_serializer = OrderSerializer(order)
        return Response(
            {
                'message': 'Hủy đơn hàng thành công',
                'order': order_serializer.data
            }
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def statistics(self, request):
        """Thống kê đơn hàng (chỉ dành cho admin)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Bạn không có quyền xem thống kê'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from django.db.models import Count, Sum
        
        # Thống kê tổng quan
        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(
            status='delivered',
            payment_status='paid'
        ).aggregate(Sum('total'))['total__sum'] or 0
        
        # Thống kê theo trạng thái
        status_stats = Order.objects.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Thống kê theo phương thức thanh toán
        payment_stats = Order.objects.values('payment_method').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'status_statistics': list(status_stats),
            'payment_statistics': list(payment_stats)
        })
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def create_vnpay_payment(self, request, pk=None):
        """
        Tạo URL thanh toán VNPay cho đơn hàng
        """
        # Lấy order theo ID trực tiếp, không qua get_object() để bypass permission check
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy đơn hàng'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra đơn hàng đã thanh toán chưa
        if order.payment_status == 'paid':
            return Response(
                {'error': 'Đơn hàng đã được thanh toán'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra phương thức thanh toán
        if order.payment_method != 'vnpay':
            return Response(
                {'error': 'Đơn hàng không sử dụng phương thức thanh toán VNPay'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Khởi tạo VNPay
            vnpay = VNPay(
                vnp_tmn_code=settings.VNPAY_TMN_CODE,
                vnp_hash_secret=settings.VNPAY_HASH_SECRET,
                vnp_url=settings.VNPAY_URL,
                vnp_return_url=settings.VNPAY_RETURN_URL
            )
            
            # Lấy IP address
            ip_address = self._get_client_ip(request)
            
            # Tạo URL thanh toán
            payment_url = vnpay.create_payment_url(
                order_id=order.order_number,
                amount=float(order.total),
                order_desc=f"Thanh toan don hang {order.order_number}",
                order_type='other',
                language='vn',
                ip_address=ip_address
            )
            
            return Response({
                'payment_url': payment_url,
                'order_number': order.order_number
            })
            
        except Exception as e:
            return Response(
                {'error': f'Lỗi tạo URL thanh toán: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def vnpay_return(self, request):
        """
        Xử lý callback từ VNPay sau khi thanh toán
        """
        try:
            # DEBUG: Log query params
            print("=== VNPAY CALLBACK DEBUG ===")
            print("Query params received:")
            for k, v in request.query_params.items():
                if k != 'vnp_SecureHash':
                    print(f"  {k} = {v}")
                else:
                    print(f"  {k} = {v[:20]}...")
            
            # Khởi tạo VNPay
            vnpay = VNPay(
                vnp_tmn_code=settings.VNPAY_TMN_CODE,
                vnp_hash_secret=settings.VNPAY_HASH_SECRET,
                vnp_url=settings.VNPAY_URL,
                vnp_return_url=settings.VNPAY_RETURN_URL
            )
            
            # Validate response
            query_params = dict(request.query_params)
            # Convert QueryDict values từ list sang string
            query_params = {k: v[0] if isinstance(v, list) else v for k, v in query_params.items()}
            
            result = vnpay.validate_response(query_params)
            
            print(f"Validation result: {'✅ VALID' if result['is_valid'] else '❌ INVALID'}")
            print(f"Response code: {result['response_code']}")
            print("=" * 50)
            
            if not result['is_valid']:
                return Response(
                    {'error': 'Chữ ký không hợp lệ'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Tìm đơn hàng
            try:
                order = Order.objects.get(order_number=result['order_id'])
            except Order.DoesNotExist:
                return Response(
                    {'error': 'Không tìm thấy đơn hàng'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Cập nhật trạng thái thanh toán
            if result['is_success']:
                order.payment_status = 'paid'
                order.status = 'confirmed'
                
                # Lưu thông tin giao dịch
                order.transaction_id = result['transaction_no']
                order.bank_code = result['bank_code']
                order.bank_transaction_no = result.get('bank_tran_no', '')
                
                order.save()
                
                return Response({
                    'message': 'Thanh toán thành công',
                    'order': OrderSerializer(order).data,
                    'transaction': result
                })
            else:
                order.payment_status = 'failed'
                order.save()
                
                return Response({
                    'message': result['message'],
                    'error': 'Thanh toán thất bại',
                    'order': OrderSerializer(order).data,
                    'transaction': result
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Lỗi xử lý callback: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def create_momo_payment(self, request, pk=None):
        """
        Tạo payment request tới MoMo cho đơn hàng
        """
        # Lấy order theo ID
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy đơn hàng'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra đơn hàng đã thanh toán chưa
        if order.payment_status == 'paid':
            return Response(
                {'error': 'Đơn hàng đã được thanh toán'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra phương thức thanh toán
        if order.payment_method != 'momo':
            return Response(
                {'error': 'Đơn hàng không sử dụng phương thức thanh toán MoMo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Khởi tạo MoMo
            momo = MoMo(
                partner_code=settings.MOMO_PARTNER_CODE,
                access_key=settings.MOMO_ACCESS_KEY,
                secret_key=settings.MOMO_SECRET_KEY,
                api_url=settings.MOMO_API_URL,
                return_url=settings.MOMO_RETURN_URL,
                notify_url=settings.MOMO_NOTIFY_URL
            )
            
            # Tạo payment request
            result = momo.create_payment_url(
                order_id=order.order_number,
                amount=float(order.total),
                order_info=f"Thanh toan don hang {order.order_number}",
                lang='vi'
            )
            
            if result['success']:
                return Response({
                    'payment_url': result['payment_url'],
                    'order_number': order.order_number,
                    'deep_link': result.get('deep_link'),
                    'qr_code_url': result.get('qr_code_url')
                })
            else:
                return Response(
                    {'error': result.get('error', 'Lỗi tạo payment request')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            return Response(
                {'error': f'Lỗi tạo payment request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def momo_return(self, request):
        """
        Xử lý callback từ MoMo sau khi thanh toán
        """
        try:
            # DEBUG: Log query params
            print("=== MOMO CALLBACK DEBUG ===")
            print("Query params received:")
            for k, v in request.query_params.items():
                if k != 'signature':
                    print(f"  {k} = {v}")
                else:
                    print(f"  {k} = {v[:20]}...")
            
            # Khởi tạo MoMo
            momo = MoMo(
                partner_code=settings.MOMO_PARTNER_CODE,
                access_key=settings.MOMO_ACCESS_KEY,
                secret_key=settings.MOMO_SECRET_KEY,
                api_url=settings.MOMO_API_URL,
                return_url=settings.MOMO_RETURN_URL,
                notify_url=settings.MOMO_NOTIFY_URL
            )
            
            # Validate response
            query_params = dict(request.query_params)
            # Convert QueryDict values từ list sang string
            query_params = {k: v[0] if isinstance(v, list) else v for k, v in query_params.items()}
            
            result = momo.validate_response(query_params)
            
            print(f"Validation result: {'✅ VALID' if result['is_valid'] else '❌ INVALID'}")
            print(f"Result code: {result['result_code']}")
            print("=" * 50)
            
            if not result['is_valid']:
                return Response(
                    {'error': 'Chữ ký không hợp lệ'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Tìm đơn hàng
            try:
                order = Order.objects.get(order_number=result['order_id'])
            except Order.DoesNotExist:
                return Response(
                    {'error': 'Không tìm thấy đơn hàng'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Cập nhật trạng thái thanh toán
            if result['is_success']:
                order.payment_status = 'paid'
                order.status = 'confirmed'
                
                # Lưu thông tin giao dịch
                order.transaction_id = result['trans_id']
                order.bank_transaction_no = result['request_id']
                
                order.save()
                
                return Response({
                    'message': 'Thanh toán thành công',
                    'order': OrderSerializer(order).data,
                    'transaction': result
                })
            else:
                order.payment_status = 'failed'
                order.save()
                
                return Response({
                    'message': result['error_message'],
                    'error': 'Thanh toán thất bại',
                    'order': OrderSerializer(order).data,
                    'transaction': result
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Lỗi xử lý callback: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def momo_ipn(self, request):
        """
        Xử lý IPN (Instant Payment Notification) từ MoMo
        Đây là webhook để MoMo thông báo kết quả thanh toán
        """
        try:
            # DEBUG: Log IPN data
            print("=== MOMO IPN DEBUG ===")
            print(f"IPN data received: {request.data}")
            
            # Khởi tạo MoMo
            momo = MoMo(
                partner_code=settings.MOMO_PARTNER_CODE,
                access_key=settings.MOMO_ACCESS_KEY,
                secret_key=settings.MOMO_SECRET_KEY,
                api_url=settings.MOMO_API_URL,
                return_url=settings.MOMO_RETURN_URL,
                notify_url=settings.MOMO_NOTIFY_URL
            )
            
            # Validate IPN
            result = momo.validate_response(request.data)
            
            print(f"IPN Validation: {'✅ VALID' if result['is_valid'] else '❌ INVALID'}")
            print("=" * 50)
            
            if not result['is_valid']:
                # Trả về response theo format của MoMo
                return Response({
                    'partnerCode': settings.MOMO_PARTNER_CODE,
                    'requestId': request.data.get('requestId'),
                    'orderId': request.data.get('orderId'),
                    'resultCode': 97,  # Invalid signature
                    'message': 'Invalid signature'
                })
            
            # Tìm và cập nhật đơn hàng
            try:
                order = Order.objects.get(order_number=result['order_id'])
                
                if result['is_success'] and order.payment_status != 'paid':
                    order.payment_status = 'paid'
                    order.status = 'confirmed'
                    order.transaction_id = result['trans_id']
                    order.bank_transaction_no = result['request_id']
                    order.save()
                    
                    print(f"✅ Order {order.order_number} updated successfully")
                
            except Order.DoesNotExist:
                print(f"❌ Order {result['order_id']} not found")
            
            # Trả về response thành công cho MoMo
            return Response({
                'partnerCode': settings.MOMO_PARTNER_CODE,
                'requestId': request.data.get('requestId'),
                'orderId': request.data.get('orderId'),
                'resultCode': 0,
                'message': 'Success'
            })
            
        except Exception as e:
            print(f"Error processing MoMo IPN: {str(e)}")
            return Response({
                'partnerCode': settings.MOMO_PARTNER_CODE,
                'requestId': request.data.get('requestId', ''),
                'orderId': request.data.get('orderId', ''),
                'resultCode': 99,
                'message': str(e)
            })
    
    def _get_client_ip(self, request):
        """Lấy IP address của client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip or '127.0.0.1'
