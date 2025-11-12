#!/usr/bin/env python
"""
Script để test reviews API
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from reviews.views import ReviewViewSet
from orders.models import Order, OrderItem
from reviews.models import Review
from users.models import User
from django.test import RequestFactory

def test_reviewable_products():
    """Test lấy danh sách sản phẩm có thể đánh giá"""
    print("=" * 80)
    print("TESTING REVIEWABLE PRODUCTS API")
    print("=" * 80)
    
    # Lấy user đầu tiên (không phải admin)
    users = User.objects.filter(role='customer')
    if not users.exists():
        print("❌ Không có customer nào trong database!")
        return
    
    user = users.first()
    print(f"\n✓ Testing với user: {user.email}")
    
    # Kiểm tra các đơn hàng đã giao
    delivered_orders = Order.objects.filter(
        user=user,
        status='delivered'
    )
    print(f"\n✓ Số đơn hàng đã giao: {delivered_orders.count()}")
    
    if delivered_orders.exists():
        for order in delivered_orders:
            print(f"  - {order.order_number} ({order.status})")
            items = order.items.all()
            print(f"    Sản phẩm: {items.count()}")
            for item in items:
                print(f"      * {item.product.name} x{item.quantity}")
    else:
        print("  ⚠️  Không có đơn hàng nào đã giao!")
    
    # Kiểm tra các OrderItem từ đơn hàng đã giao
    order_items = OrderItem.objects.filter(
        order__user=user,
        order__status='delivered'
    ).select_related('product', 'order')
    
    print(f"\n✓ Tổng số OrderItem từ đơn hàng đã giao: {order_items.count()}")
    
    # Kiểm tra reviews đã có
    reviews = Review.objects.filter(user=user)
    print(f"\n✓ Số đánh giá đã có: {reviews.count()}")
    
    if reviews.exists():
        for review in reviews:
            print(f"  - {review.product.name} (Order: {review.order.order_number if review.order else 'N/A'})")
    
    # Lọc sản phẩm chưa đánh giá
    reviewed_product_order_pairs = Review.objects.filter(
        user=user
    ).values_list('product_id', 'order_id')
    
    print(f"\n✓ Các cặp (product_id, order_id) đã đánh giá:")
    for pair in reviewed_product_order_pairs:
        print(f"  - Product ID: {pair[0]}, Order ID: {pair[1]}")
    
    reviewable_items = []
    for item in order_items:
        if (item.product.id, item.order.id) not in reviewed_product_order_pairs:
            reviewable_items.append(item)
    
    print(f"\n✓ Số sản phẩm có thể đánh giá: {len(reviewable_items)}")
    
    if reviewable_items:
        print("\n📋 Danh sách sản phẩm có thể đánh giá:")
        for item in reviewable_items:
            print(f"  - {item.product.name}")
            print(f"    Order: {item.order.order_number}")
            print(f"    Product ID: {item.product.id}, Order ID: {item.order.id}")
    else:
        print("\n⚠️  Không có sản phẩm nào để đánh giá!")
        print("\nNguyên nhân có thể:")
        print("  1. Tất cả sản phẩm đã được đánh giá")
        print("  2. Không có đơn hàng nào ở trạng thái 'delivered'")
        print("  3. Đơn hàng đã giao nhưng không có sản phẩm")
    
    print("\n" + "=" * 80)

if __name__ == '__main__':
    test_reviewable_products()
