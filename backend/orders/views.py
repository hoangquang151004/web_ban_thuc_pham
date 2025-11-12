from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
    OrderUpdateStatusSerializer
)


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet cho Order"""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def get_permissions(self):
        """Phân quyền"""
        if self.action in ['create']:
            # Cho phép tạo đơn hàng không cần đăng nhập (guest checkout)
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
