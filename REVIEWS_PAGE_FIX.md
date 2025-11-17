# Fix Reviews Page - Tóm tắt các thay đổi

## Vấn đề

Trang đánh giá (customer/reviews) gặp lỗi khi cố gắng truy cập `main_image_url` từ Product model:

```
AttributeError: 'Product' object has no attribute 'main_image_url'
```

## Nguyên nhân

- `main_image_url` là một `SerializerMethodField` trong ProductSerializer, không phải một attribute/property của Product model
- ReviewSerializer và ProductReviewableSerializer đang cố gắng truy cập `obj.product.main_image_url` trực tiếp
- Context (bao gồm request) không được truyền vào ReviewSerializer khi tạo/cập nhật review

## Các thay đổi đã thực hiện

### 1. Backend - reviews/serializers.py

#### ReviewSerializer.get_product_image()

```python
# TRƯỚC (SAI)
def get_product_image(self, obj):
    if obj.product.main_image_url:  # ❌ main_image_url không tồn tại
        return obj.product.main_image_url
    return None

# SAU (ĐÚNG)
def get_product_image(self, obj):
    try:
        if obj.product and obj.product.main_image:  # ✓ Truy cập main_image (ImageField)
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.main_image.url)
            return obj.product.main_image.url
    except Exception as e:
        print(f"Error getting product image in ReviewSerializer: {e}")
    return None
```

#### ProductReviewableSerializer.get_product_image()

```python
# TRƯỚC (Thiếu error handling)
def get_product_image(self, obj):
    if hasattr(obj, 'product') and obj.product.main_image:
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.product.main_image.url)
        return obj.product.main_image.url
    return None

# SAU (Có error handling)
def get_product_image(self, obj):
    try:
        if hasattr(obj, 'product') and obj.product and obj.product.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.main_image.url)
            return obj.product.main_image.url
    except Exception as e:
        print(f"Error getting product image: {e}")
    return None
```

### 2. Backend - reviews/views.py

#### ReviewViewSet.create()

```python
# TRƯỚC (Thiếu context)
review_serializer = ReviewSerializer(review)

# SAU (Có context)
review_serializer = ReviewSerializer(review, context={'request': request})
```

#### ReviewViewSet.update()

```python
# TRƯỚC (Thiếu context)
review_serializer = ReviewSerializer(instance)

# SAU (Có context)
review_serializer = ReviewSerializer(instance, context={'request': request})
```

#### ReviewViewSet.reviewable_products()

```python
# TRƯỚC (Thiếu context)
serializer = ProductReviewableSerializer(reviewable_items, many=True)

# SAU (Có context)
serializer = ProductReviewableSerializer(
    reviewable_items,
    many=True,
    context={'request': request}
)
```

### 3. Frontend - app/(main)/customer/reviews/page.tsx

#### Cải thiện error handling

```typescript
const loadReviews = async () => {
  try {
    setLoading(true);
    const response = await reviewAPI.getMyReviews();
    console.log("My reviews response:", response);

    // Kiểm tra response có phải là error object không
    if (response && typeof response === "object" && !Array.isArray(response)) {
      if (response.message || response.error) {
        throw new Error(response.message || response.error);
      }
    }

    setReviews(Array.isArray(response) ? response : []);
  } catch (error: any) {
    console.error("Error loading reviews:", error);
    toast.current?.show({
      severity: "error",
      summary: "Lỗi tải đánh giá",
      detail: error.message || "Không thể tải danh sách đánh giá",
      life: 3000,
    });
  } finally {
    setLoading(false);
  }
};
```

#### Cải thiện UI

- Thêm loading state rõ ràng hơn
- Hiển thị thông báo khi không có dữ liệu
- Thêm icon và message hữu ích cho người dùng
- Tách riêng section cho "Sản phẩm chưa đánh giá" và "Đánh giá của tôi"

### 4. Script debug - test_reviews_api.py

Tạo script để test và debug API, kiểm tra:

- User có đơn hàng đã giao không
- Có sản phẩm nào chưa đánh giá không
- Dữ liệu reviews trong database

## Cách sử dụng

### Restart backend để áp dụng thay đổi

```bash
cd d:\web_ban_thuc_pham\web_ban_thuc_pham\backend
python manage.py runserver
```

### Test API (optional)

```bash
cd d:\web_ban_thuc_pham\web_ban_thuc_pham\backend
python test_reviews_api.py
```

### Test frontend

1. Đảm bảo backend đang chạy
2. Mở trình duyệt và đăng nhập
3. Vào trang `/customer/reviews`
4. Kiểm tra console để xem API response

## Kết quả mong đợi

✓ Trang reviews load được danh sách sản phẩm chưa đánh giá  
✓ Hiển thị đúng hình ảnh sản phẩm  
✓ Có thể tạo đánh giá mới thành công  
✓ Có thể sửa/xóa đánh giá  
✓ Không còn lỗi AttributeError  
✓ UI hiển thị thân thiện khi không có dữ liệu

## Ghi chú

### Về Product.main_image

- `main_image` là ImageField trong model
- `main_image_url` là SerializerMethodField trong serializer
- Luôn truy cập `main_image` (field) thay vì `main_image_url` (serializer method) khi làm việc với model instance

### Về context trong serializer

- ViewSet tự động truyền context khi dùng `self.get_serializer()`
- Khi tạo serializer instance thủ công, phải truyền `context={'request': request}`
- Context cần thiết để tạo absolute URL cho images

### Về error handling

- Luôn wrap code có thể lỗi trong try-except
- Log errors để dễ debug
- Hiển thị thông báo lỗi hữu ích cho người dùng
