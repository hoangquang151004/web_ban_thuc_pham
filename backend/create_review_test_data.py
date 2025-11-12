"""
Script tạo dữ liệu mẫu để test trang Reviews
Chạy: python manage.py shell < create_review_test_data.py
Hoặc: python manage.py shell
>>> exec(open('create_review_test_data.py').read())
"""

from django.contrib.auth import get_user_model
from products.models import Product
from orders.models import Order, OrderItem
from decimal import Decimal

User = get_user_model()

print("=" * 50)
print("Tạo dữ liệu test cho Reviews")
print("=" * 50)

# 1. Lấy hoặc tạo user
try:
    # Thử lấy user hiện có
    user = User.objects.filter(role='customer').first()
    if not user:
        print("\n❌ Không tìm thấy user customer nào!")
        print("💡 Vui lòng tạo user customer trước:")
        print("   - Đăng ký tài khoản mới qua frontend")
        print("   - Hoặc tạo qua admin: http://localhost:8000/admin/")
        exit()
    
    print(f"\n✅ Sử dụng user: {user.email}")
    
except Exception as e:
    print(f"❌ Lỗi khi lấy user: {e}")
    exit()

# 2. Lấy sản phẩm
products = Product.objects.filter(status='active')[:3]
if not products:
    print("\n❌ Không có sản phẩm nào trong database!")
    print("💡 Vui lòng tạo sản phẩm trước qua admin")
    exit()

print(f"✅ Tìm thấy {products.count()} sản phẩm")

# 3. Tạo đơn hàng đã giao
try:
    # Tạo order với status delivered
    order = Order.objects.create(
        user=user,
        order_number=f'TEST-{Order.objects.count() + 1:06d}',
        full_name=user.full_name or user.email.split('@')[0],
        phone='0123456789',
        email=user.email,
        address='123 Đường Test, Quận Test',
        district='Quận Test',
        city='TP.HCM',
        note='Đơn hàng test để đánh giá',
        subtotal=Decimal('0'),
        shipping_fee=Decimal('30000'),
        total=Decimal('0'),
        status='delivered',  # ⭐ Quan trọng: Phải là delivered
        payment_method='cod',
        payment_status='pending'
    )
    
    print(f"\n✅ Tạo đơn hàng: {order.order_number}")
    
    # 4. Thêm sản phẩm vào đơn hàng
    total = Decimal('0')
    for product in products:
        item = OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            product_price=product.price,
            quantity=1,
            subtotal=product.price
        )
        total += product.price
        print(f"   - Thêm: {product.name} ({product.price:,}đ)")
    
    # 5. Cập nhật tổng tiền
    order.subtotal = total
    order.total = total + order.shipping_fee
    order.save()
    
    print(f"\n✅ Tổng tiền: {order.total:,}đ")
    print(f"✅ Trạng thái: {order.get_status_display()}")
    
    print("\n" + "=" * 50)
    print("🎉 Hoàn thành!")
    print("=" * 50)
    print("\n📋 Hướng dẫn test:")
    print("1. Đăng nhập với user:", user.email)
    print("2. Vào trang: /customer/reviews")
    print(f"3. Bạn sẽ thấy {products.count()} sản phẩm chưa đánh giá")
    print("4. Click 'Đánh giá ngay' để thêm review")
    print("\n💡 Tip: Sau khi đánh giá xong, sản phẩm sẽ biến mất khỏi danh sách 'Chưa đánh giá'")
    
except Exception as e:
    print(f"\n❌ Lỗi khi tạo đơn hàng: {e}")
    import traceback
    traceback.print_exc()
