from rest_framework import serializers
from .models import Review
from products.models import Product
from orders.models import Order


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer cho Review"""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'product', 'product_name', 'product_image',
            'order', 'order_number',
            'rating', 'comment', 'images',
            'is_verified_purchase', 'is_approved', 'status',
            'helpful_count', 'reply', 'reply_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'is_verified_purchase',
            'helpful_count', 'reply', 'reply_date',
            'created_at', 'updated_at'
        ]
    
    def get_status(self, obj):
        """Convert is_approved to status string for frontend compatibility"""
        # For now, we only have approved/pending states
        # You can extend this to include 'rejected' if needed
        if obj.is_approved:
            return 'approved'
        return 'pending'
    
    def get_product_image(self, obj):
        """Get product main image URL"""
        try:
            if obj.product and obj.product.main_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.product.main_image.url)
                return obj.product.main_image.url
        except Exception as e:
            print(f"Error getting product image in ReviewSerializer: {e}")
        return None


class ReviewCreateSerializer(serializers.Serializer):
    """Serializer cho việc tạo review"""
    
    product_id = serializers.IntegerField()
    order_id = serializers.IntegerField(required=False, allow_null=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=2000)
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    
    def validate_product_id(self, value):
        """Validate product exists"""
        try:
            Product.objects.get(id=value, status='active')
        except Product.DoesNotExist:
            raise serializers.ValidationError("Sản phẩm không tồn tại hoặc đã ngừng bán")
        return value
    
    def validate_order_id(self, value):
        """Validate order exists and belongs to user"""
        if value:
            try:
                order = Order.objects.get(id=value)
                user = self.context['request'].user
                
                if order.user != user:
                    raise serializers.ValidationError("Đơn hàng không thuộc về bạn")
                    
                if order.status not in ['delivered']:
                    raise serializers.ValidationError("Chỉ có thể đánh giá đơn hàng đã giao")
                    
            except Order.DoesNotExist:
                raise serializers.ValidationError("Đơn hàng không tồn tại")
        return value
    
    def validate(self, data):
        """Validate không trùng review"""
        user = self.context['request'].user
        product_id = data['product_id']
        order_id = data.get('order_id')
        
        # Check if already reviewed
        query = Review.objects.filter(
            user=user,
            product_id=product_id
        )
        
        if order_id:
            query = query.filter(order_id=order_id)
        
        if query.exists():
            raise serializers.ValidationError("Bạn đã đánh giá sản phẩm này rồi")
        
        return data
    
    def create(self, validated_data):
        """Create review"""
        user = self.context['request'].user
        
        review = Review.objects.create(
            user=user,
            product_id=validated_data['product_id'],
            order_id=validated_data.get('order_id'),
            rating=validated_data['rating'],
            comment=validated_data['comment'],
            images=validated_data.get('images', [])
        )
        
        return review


class ReviewUpdateSerializer(serializers.Serializer):
    """Serializer cho việc cập nhật review"""
    
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    comment = serializers.CharField(max_length=2000, required=False)
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    
    def update(self, instance, validated_data):
        """Update review"""
        instance.rating = validated_data.get('rating', instance.rating)
        instance.comment = validated_data.get('comment', instance.comment)
        instance.images = validated_data.get('images', instance.images)
        instance.save()
        
        return instance


class ProductReviewableSerializer(serializers.Serializer):
    """Serializer cho sản phẩm có thể đánh giá"""
    
    product_id = serializers.IntegerField(source='product.id')
    product_name = serializers.CharField(source='product.name')
    product_image = serializers.SerializerMethodField()
    order_id = serializers.IntegerField(source='order.id')
    order_number = serializers.CharField(source='order.order_number')
    
    def get_product_image(self, obj):
        """Get product main image URL"""
        try:
            if hasattr(obj, 'product') and obj.product and obj.product.main_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.product.main_image.url)
                return obj.product.main_image.url
        except Exception as e:
            print(f"Error getting product image: {e}")
        return None
