# Hướng Dẫn Sử Dụng Chức Năng Giỏ Hàng

## Tổng Quan

Chức năng giỏ hàng đã được hoàn thiện với đầy đủ các tính năng:

- ✅ Thêm sản phẩm vào giỏ hàng
- ✅ Cập nhật số lượng sản phẩm
- ✅ Xóa sản phẩm khỏi giỏ hàng
- ✅ Xóa tất cả sản phẩm
- ✅ Hiển thị số lượng items trên topbar
- ✅ Kiểm tra tồn kho
- ✅ Tính toán tổng tiền

## Cấu Trúc Backend

### 1. Models (backend/carts/models.py)

#### Cart Model

```python
class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Properties:**

- `total_items`: Tổng số lượng items
- `total_price`: Tổng giá trị giỏ hàng
- `items_count`: Số loại sản phẩm khác nhau

#### CartItem Model

```python
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=12, decimal_places=0)
```

**Properties:**

- `subtotal`: Tổng tiền của item (quantity \* price)

### 2. API Endpoints

#### Lấy giỏ hàng

```
GET /api/cart/
```

**Response:**

```json
{
  "id": 1,
  "items": [...],
  "total_items": 5,
  "total_price": 250000,
  "items_count": 3
}
```

#### Thêm sản phẩm vào giỏ

```
POST /api/cart/add_item/
```

**Body:**

```json
{
  "product_id": 1,
  "quantity": 2
}
```

#### Cập nhật số lượng

```
PUT /api/cart/update_item/
```

**Body:**

```json
{
  "product_id": 1,
  "quantity": 3
}
```

#### Xóa sản phẩm

```
DELETE /api/cart/remove_item/
```

**Body:**

```json
{
  "product_id": 1
}
```

#### Xóa tất cả

```
POST /api/cart/clear/
```

#### Lấy số lượng items

```
GET /api/cart/count/
```

**Response:**

```json
{
  "count": 5,
  "items_count": 3
}
```

## Cấu Trúc Frontend

### 1. CartContext (layout/context/cartcontext.tsx)

Context API để quản lý trạng thái giỏ hàng toàn ứng dụng.

**Hooks:**

```typescript
const {
  cart, // Giỏ hàng hiện tại
  loading, // Trạng thái loading
  addToCart, // Thêm sản phẩm
  updateCartItem, // Cập nhật số lượng
  removeFromCart, // Xóa sản phẩm
  clearCart, // Xóa tất cả
  refreshCart, // Làm mới giỏ hàng
  getCartCount, // Lấy số lượng items
} = useCart();
```

**Sử dụng:**

```typescript
// Thêm sản phẩm vào giỏ
await addToCart(productId, quantity);

// Cập nhật số lượng
await updateCartItem(productId, newQuantity);

// Xóa sản phẩm
await removeFromCart(productId);

// Lấy số lượng items
const count = getCartCount();
```

### 2. Trang Giỏ Hàng (app/(main)/customer/cart/page.tsx)

Hiển thị danh sách sản phẩm trong giỏ với các tính năng:

- Hiển thị hình ảnh, tên, giá sản phẩm
- Tăng/giảm số lượng
- Xóa sản phẩm
- Xóa tất cả sản phẩm
- Tính toán tổng tiền
- Hiển thị phí vận chuyển (miễn phí với đơn ≥ 500k)

### 3. Tích Hợp Vào Trang Sản Phẩm

File: `app/(main)/customer/products/[id]/page.tsx`

```typescript
import { useCart } from "@/layout/context/cartcontext";

const { addToCart, loading: cartLoading } = useCart();

const handleAddToCart = async () => {
  try {
    await addToCart(product.id, quantity);
    toast.show({ severity: "success", summary: "Đã thêm vào giỏ" });
  } catch (error) {
    toast.show({ severity: "error", summary: "Lỗi" });
  }
};
```

### 4. Hiển Thị Số Lượng Trên Topbar

File: `layout/AppTopbar.tsx`

```typescript
import { useCart } from "./context/cartcontext";

const { getCartCount } = useCart();

<Badge value={getCartCount()} severity="danger" />;
```

## Cài Đặt và Chạy

### 1. Backend Setup

```bash
# Di chuyển đến thư mục backend
cd web_ban_thuc_pham\backend

# Tạo migrations
python manage.py makemigrations carts

# Chạy migrations
python manage.py migrate

# Khởi động server
python manage.py runserver
```

### 2. Frontend Setup

```bash
# Di chuyển đến thư mục frontend
cd web_ban_thuc_pham\frontend

# Cài đặt dependencies (nếu cần)
npm install

# Khởi động development server
npm run dev
```

## Kiểm Tra Authentication

Chức năng giỏ hàng yêu cầu người dùng đã đăng nhập. Đảm bảo:

1. User đã đăng nhập (có access_token trong localStorage)
2. Token còn hiệu lực
3. API endpoint `/api/cart/` có quyền `IsAuthenticated`

## Xử Lý Lỗi

### Lỗi thường gặp:

1. **401 Unauthorized**: User chưa đăng nhập

   - Giải pháp: Chuyển hướng đến trang đăng nhập

2. **400 Bad Request - Không đủ tồn kho**

   - Giải pháp: Hiển thị thông báo lỗi, đề xuất số lượng tối đa

3. **404 Not Found - Sản phẩm không tồn tại**
   - Giải pháp: Xóa item khỏi giỏ hàng local

## Tính Năng Nâng Cao (Đã Chuẩn Bị)

### Guest Cart (Chưa Triển Khai)

Trong `cartcontext.tsx` đã có sẵn logic để xử lý giỏ hàng cho guest users (chưa đăng nhập) sử dụng localStorage. Để kích hoạt:

1. Uncomment các dòng TODO trong CartContext
2. Implement logic sync giỏ hàng khi user đăng nhập

### Tối Ưu Hóa

1. **Debounce cập nhật số lượng**: Tránh gọi API quá nhiều khi user thay đổi số lượng nhanh
2. **Optimistic Update**: Cập nhật UI ngay lập tức, rollback nếu API fail
3. **Cache**: Sử dụng React Query hoặc SWR để cache dữ liệu giỏ hàng

## Testing

### Test Backend API

```bash
# Sử dụng Django shell
python manage.py shell

from users.models import User
from products.models import Product
from carts.models import Cart, CartItem

# Tạo giỏ hàng
user = User.objects.first()
cart = Cart.objects.create(user=user)

# Thêm sản phẩm
product = Product.objects.first()
item = CartItem.objects.create(cart=cart, product=product, quantity=2)

# Kiểm tra
print(cart.total_items)  # 2
print(cart.total_price)  # Giá * 2
```

### Test Frontend

1. Đăng nhập vào hệ thống
2. Truy cập trang sản phẩm: `/customer/products`
3. Click vào một sản phẩm
4. Chọn số lượng và click "Thêm vào giỏ"
5. Kiểm tra badge trên topbar có tăng số lượng
6. Truy cập trang giỏ hàng: `/customer/cart`
7. Kiểm tra các chức năng: tăng/giảm số lượng, xóa sản phẩm

## Troubleshooting

### Giỏ hàng không cập nhật

- Kiểm tra console browser xem có lỗi API
- Kiểm tra network tab xem response từ server
- Verify token còn hiệu lực

### Số lượng không hiển thị trên topbar

- Đảm bảo CartProvider đã wrap toàn bộ app trong `app/layout.tsx`
- Kiểm tra useCart() có được gọi đúng không

### Lỗi CORS

- Kiểm tra CORS_ALLOWED_ORIGINS trong settings.py
- Đảm bảo frontend đang chạy trên port được allow

## Liên Hệ và Hỗ Trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra console logs
2. Kiểm tra Django logs
3. Review lại các bước cài đặt
4. Đảm bảo database đã được migrate đúng

---

**Phiên bản**: 1.0.0  
**Ngày tạo**: 11/11/2025  
**Tác giả**: GitHub Copilot
