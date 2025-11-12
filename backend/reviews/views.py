from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import Review
from .serializers import (
    ReviewSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer,
    ProductReviewableSerializer
)
from orders.models import Order, OrderItem


class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet cho Review"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Lọc queryset theo user"""
        user = self.request.user
        
        if not user.is_authenticated:
            return Review.objects.none()
        
        # Admin có thể xem tất cả reviews
        if user.role == 'admin':
            return Review.objects.all().select_related(
                'user', 'product', 'order'
            )
        
        # User chỉ xem được reviews của mình
        return Review.objects.filter(
            user=user
        ).select_related('product', 'order')
    
    def get_serializer_class(self):
        """Chọn serializer phù hợp"""
        if self.action == 'create':
            return ReviewCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReviewUpdateSerializer
        return ReviewSerializer
    
    def create(self, request, *args, **kwargs):
        """Tạo review mới"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        review = serializer.save()
        
        # Serialize review để trả về với context
        review_serializer = ReviewSerializer(review, context={'request': request})
        
        return Response(
            {
                'message': 'Đánh giá đã được gửi thành công',
                'review': review_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Cập nhật review"""
        instance = self.get_object()
        
        # Chỉ owner mới có thể sửa
        if instance.user != request.user and request.user.role != 'admin':
            return Response(
                {'error': 'Bạn không có quyền sửa đánh giá này'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Admin có thể cập nhật status (approved/rejected/pending)
        if request.user.role == 'admin' and 'status' in request.data:
            status_value = request.data.get('status')
            if status_value == 'approved':
                instance.is_approved = True
            elif status_value in ['rejected', 'pending']:
                instance.is_approved = False
            instance.save()
            
            # Trả về review đã cập nhật
            review_serializer = ReviewSerializer(instance, context={'request': request})
            return Response(
                {
                    'message': 'Trạng thái đánh giá đã được cập nhật',
                    'review': review_serializer.data
                }
            )
        
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=kwargs.get('partial', False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Trả về review đã cập nhật với context
        review_serializer = ReviewSerializer(instance, context={'request': request})
        return Response(
            {
                'message': 'Đánh giá đã được cập nhật',
                'review': review_serializer.data
            }
        )
    
    def destroy(self, request, *args, **kwargs):
        """Xóa review"""
        instance = self.get_object()
        
        # Chỉ owner mới có thể xóa
        if instance.user != request.user and request.user.role != 'admin':
            return Response(
                {'error': 'Bạn không có quyền xóa đánh giá này'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
        
        return Response(
            {'message': 'Đánh giá đã được xóa'},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_reviews(self, request):
        """Lấy danh sách đánh giá của user hiện tại"""
        reviews = Review.objects.filter(
            user=request.user
        ).select_related('product', 'order').order_by('-created_at')
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def reviewable_products(self, request):
        """Lấy danh sách sản phẩm có thể đánh giá (đã mua, chưa đánh giá)"""
        user = request.user
        
        # Lấy các order items từ đơn hàng đã giao
        order_items = OrderItem.objects.filter(
            order__user=user,
            order__status='delivered'
        ).select_related('product', 'order')
        
        # Loại bỏ các sản phẩm đã đánh giá
        reviewed_product_order_pairs = Review.objects.filter(
            user=user
        ).values_list('product_id', 'order_id')
        
        reviewable_items = []
        for item in order_items:
            # Check if not reviewed
            if (item.product.id, item.order.id) not in reviewed_product_order_pairs:
                reviewable_items.append(item)
        
        serializer = ProductReviewableSerializer(
            reviewable_items, 
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def by_product(self, request):
        """Lấy reviews theo sản phẩm"""
        product_id = request.query_params.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id là bắt buộc'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reviews = Review.objects.filter(
            product_id=product_id,
            is_approved=True
        ).select_related('user', 'product', 'order').order_by('-created_at')
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
