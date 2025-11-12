"""
Script để tạo dữ liệu test cho reviews
Chạy: python manage.py shell < create_test_reviews.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product
from reviews.models import Review
from orders.models import Order

User = get_user_model()

def create_test_reviews():
    """Tạo reviews test"""
    
    print("🚀 Bắt đầu tạo dữ liệu test reviews...")
    
    # Lấy hoặc tạo users
    try:
        admin = User.objects.get(email='admin@example.com')
        print(f"✓ Found admin user: {admin.email}")
    except User.DoesNotExist:
        print("✗ Admin user not found. Please create admin user first.")
        return
    
    # Tạo customer users
    customers = []
    customer_data = [
        {'email': 'customer1@example.com', 'full_name': 'Nguyễn Văn An', 'username': 'customer1'},
        {'email': 'customer2@example.com', 'full_name': 'Trần Thị Bình', 'username': 'customer2'},
        {'email': 'customer3@example.com', 'full_name': 'Lê Hoàng Cường', 'username': 'customer3'},
    ]
    
    for data in customer_data:
        user, created = User.objects.get_or_create(
            email=data['email'],
            defaults={
                'username': data['username'],
                'full_name': data['full_name'],
                'role': 'customer',
                'is_active': True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"✓ Created customer: {user.full_name}")
        else:
            print(f"✓ Found customer: {user.full_name}")
        customers.append(user)
    
    # Lấy products
    products = list(Product.objects.filter(status='active')[:5])
    if not products:
        print("✗ No active products found. Please create products first.")
        return
    
    print(f"✓ Found {len(products)} active products")
    
    # Tạo orders cho customers
    orders = []
    for customer in customers:
        for product in products[:2]:  # 2 sản phẩm cho mỗi customer
            order, created = Order.objects.get_or_create(
                user=customer,
                defaults={
                    'order_number': f'ORD{customer.id}{product.id}',
                    'full_name': customer.full_name,
                    'phone': '0123456789',
                    'email': customer.email,
                    'address': '123 Test Street',
                    'city': 'Ho Chi Minh',
                    'district': 'District 1',
                    'status': 'delivered',
                    'payment_method': 'cod',
                    'total_amount': product.price * 2,
                }
            )
            if created:
                print(f"✓ Created order for {customer.full_name}")
            orders.append((order, customer, product))
    
    # Xóa reviews cũ nếu có
    Review.objects.all().delete()
    print("✓ Cleared old reviews")
    
    # Tạo reviews
    reviews_data = [
        {
            'user': customers[0],
            'product': products[0],
            'rating': 5,
            'comment': 'Sản phẩm rất tươi và ngon! Tôi rất hài lòng với chất lượng. Đóng gói cẩn thận, giao hàng nhanh chóng.',
            'is_approved': True,
        },
        {
            'user': customers[0],
            'product': products[1],
            'rating': 4,
            'comment': 'Sản phẩm tốt nhưng giá hơi cao. Chất lượng ổn, sẽ mua lại lần sau.',
            'is_approved': True,
        },
        {
            'user': customers[1],
            'product': products[0],
            'rating': 5,
            'comment': 'Tuyệt vời! Đây là lần thứ 3 tôi mua sản phẩm này. Luôn tươi và đúng như mô tả.',
            'is_approved': False,  # Pending
        },
        {
            'user': customers[1],
            'product': products[2],
            'rating': 3,
            'comment': 'Sản phẩm bình thường, không có gì đặc biệt.',
            'is_approved': False,  # Pending
        },
        {
            'user': customers[2],
            'product': products[1],
            'rating': 5,
            'comment': 'Chất lượng xuất sắc! Gia đình tôi rất thích. Shop phục vụ nhiệt tình.',
            'is_approved': True,
        },
        {
            'user': customers[2],
            'product': products[3],
            'rating': 2,
            'comment': 'Không như mong đợi. Sản phẩm không tươi lắm.',
            'is_approved': False,  # Pending
        },
    ]
    
    created_count = 0
    for data in reviews_data:
        try:
            # Tìm order tương ứng
            order = Order.objects.filter(
                user=data['user'],
                status='delivered'
            ).first()
            
            review, created = Review.objects.get_or_create(
                user=data['user'],
                product=data['product'],
                defaults={
                    'order': order,
                    'rating': data['rating'],
                    'comment': data['comment'],
                    'is_approved': data['is_approved'],
                    'is_verified_purchase': True if order else False,
                }
            )
            
            if created:
                created_count += 1
                status = "✓ Đã duyệt" if review.is_approved else "⏳ Chờ duyệt"
                print(f"{status} - Review {review.rating}⭐ cho {review.product.name} bởi {review.user.full_name}")
        except Exception as e:
            print(f"✗ Error creating review: {e}")
    
    print(f"\n✅ Hoàn thành! Đã tạo {created_count} reviews mới")
    print(f"📊 Tổng số reviews: {Review.objects.count()}")
    print(f"   - Đã duyệt: {Review.objects.filter(is_approved=True).count()}")
    print(f"   - Chờ duyệt: {Review.objects.filter(is_approved=False).count()}")

if __name__ == '__main__':
    create_test_reviews()
