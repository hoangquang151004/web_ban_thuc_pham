# Hướng Dẫn Chức Năng Thanh Toán - Hệ Thống Bán Thực Phẩm

## Tổng Quan

Hệ thống thanh toán đã được hoàn thiện với đầy đủ chức năng từ backend đến frontend, bao gồm:

- Quản lý giỏ hàng (LocalStorage)
- Tạo đơn hàng từ giỏ hàng
- Xem danh sách đơn hàng
- Xem chi tiết đơn hàng
- Hủy đơn hàng
- Quản lý trạng thái đơn hàng (Admin)

## Cấu Trúc Backend

### 1. Models (backend/orders/models.py)

#### Order Model

- `order_number`: Mã đơn hàng (tự động tạo)
- `user`: Người dùng (có thể null cho guest checkout)
- `full_name`, `phone`, `email`: Thông tin người nhận
- `address`, `district`, `city`: Địa chỉ giao hàng
- `note`: Ghi chú
- `subtotal`: Tạm tính
- `shipping_fee`: Phí vận chuyển (miễn phí nếu >= 500k)
- `total`: Tổng tiền
- `status`: Trạng thái đơn hàng
  - `pending`: Chờ xác nhận
  - `confirmed`: Đã xác nhận
  - `processing`: Đang xử lý
  - `shipping`: Đang giao hàng
  - `delivered`: Đã giao hàng
  - `cancelled`: Đã hủy
  - `returned`: Đã trả hàng
- `payment_method`: Phương thức thanh toán (cod, vnpay, momo, banking)
- `payment_status`: Trạng thái thanh toán (pending, paid, failed, refunded)

#### OrderItem Model

- `order`: Đơn hàng
- `product`: Sản phẩm
- `product_name`: Tên sản phẩm (snapshot)
- `product_price`: Giá sản phẩm (snapshot)
- `quantity`: Số lượng
- `subtotal`: Thành tiền

### 2. API Endpoints

#### Tạo đơn hàng

```
POST /api/orders/
```

**Request Body:**

```json
{
  "full_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "nguyenvana@example.com",
  "address": "123 Nguyễn Văn Linh",
  "district": "Quận 7",
  "city": "TP. Hồ Chí Minh",
  "note": "Giao giờ hành chính",
  "payment_method": "cod",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

**Response:**

```json
{
  "message": "Đặt hàng thành công",
  "order": {
    "id": 1,
    "order_number": "ORD20241112123456",
    "full_name": "Nguyễn Văn A",
    "phone": "0901234567",
    ...
  }
}
```

#### Lấy danh sách đơn hàng

```
GET /api/orders/
GET /api/orders/?status=pending
GET /api/orders/?payment_method=cod
```

**Response:**

```json
[
  {
    "id": 1,
    "order_number": "ORD20241112123456",
    "user": 1,
    "full_name": "Nguyễn Văn A",
    "subtotal": 470000,
    "shipping_fee": 0,
    "total": 470000,
    "status": "pending",
    "status_display": "Chờ xác nhận",
    "payment_method": "cod",
    "payment_method_display": "Thanh toán khi nhận hàng",
    "items": [...]
  }
]
```

#### Lấy chi tiết đơn hàng

```
GET /api/orders/{id}/
```

#### Hủy đơn hàng

```
POST /api/orders/{id}/cancel/
```

**Response:**

```json
{
  "message": "Hủy đơn hàng thành công",
  "order": {...}
}
```

#### Cập nhật trạng thái đơn hàng (Admin only)

```
POST /api/orders/{id}/update_status/
```

**Request Body:**

```json
{
  "status": "confirmed"
}
```

#### Thống kê đơn hàng (Admin only)

```
GET /api/orders/statistics/
```

## Cấu Trúc Frontend

### 1. Cart Context (frontend/layout/context/cartcontext.tsx)

Context quản lý giỏ hàng sử dụng LocalStorage:

```typescript
const {
  cart, // Giỏ hàng hiện tại
  loading, // Trạng thái loading
  addToCart, // Thêm sản phẩm vào giỏ
  updateCartItem, // Cập nhật số lượng
  removeFromCart, // Xóa sản phẩm
  clearCart, // Xóa toàn bộ giỏ hàng
  getCartCount, // Lấy số lượng items
} = useCart();
```

### 2. Trang Giỏ Hàng (frontend/app/(main)/customer/cart/page.tsx)

Chức năng:

- Hiển thị danh sách sản phẩm trong giỏ
- Cập nhật số lượng sản phẩm
- Xóa sản phẩm khỏi giỏ
- Xóa toàn bộ giỏ hàng
- Tính toán tạm tính, phí vận chuyển, tổng tiền
- Chuyển sang trang thanh toán

### 3. Trang Thanh Toán (frontend/app/(main)/customer/checkout/page.tsx)

Chức năng:

- Hiển thị sản phẩm từ giỏ hàng
- Form nhập thông tin giao hàng
- Chọn phương thức thanh toán
- Validation form
- Gọi API tạo đơn hàng
- Xóa giỏ hàng sau khi đặt hàng thành công
- Chuyển hướng đến trang đơn hàng

**Validation:**

- Họ tên, số điện thoại, địa chỉ: Bắt buộc
- Số điện thoại: 10-11 số
- Email: Format hợp lệ (nếu có)

### 4. Trang Đơn Hàng (frontend/app/(main)/customer/orders/page.tsx)

Chức năng:

- Hiển thị danh sách đơn hàng
- Xem chi tiết đơn hàng
- Hủy đơn hàng (chỉ khi status = pending hoặc confirmed)
- Filter theo trạng thái
- Phân trang

## Cách Chạy Hệ Thống

### 1. Backend Setup

```bash
# Di chuyển vào thư mục backend
cd backend

# Chạy migrations
python manage.py makemigrations orders
python manage.py migrate

# Tạo superuser (nếu chưa có)
python manage.py createsuperuser

# Chạy server
python manage.py runserver
```

### 2. Frontend Setup

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies (nếu chưa có)
npm install

# Chạy development server
npm run dev
```

### 3. Cấu Hình

Đảm bảo file `.env.local` trong frontend có:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Flow Thanh Toán

1. **Thêm sản phẩm vào giỏ hàng**

   - User browse sản phẩm → Nhấn "Thêm vào giỏ"
   - Sản phẩm được lưu vào LocalStorage

2. **Xem giỏ hàng**

   - User truy cập `/customer/cart`
   - Xem danh sách sản phẩm, tổng tiền
   - Có thể cập nhật số lượng hoặc xóa sản phẩm

3. **Thanh toán**

   - User nhấn "Thanh toán" → Chuyển đến `/customer/checkout`
   - Nhập thông tin giao hàng
   - Chọn phương thức thanh toán
   - Nhấn "Đặt hàng"

4. **Xử lý đơn hàng (Backend)**

   - Validate thông tin
   - Kiểm tra tồn kho
   - Tạo Order và OrderItems
   - Giảm số lượng tồn kho
   - Tăng số lượng đã bán
   - Trả về thông tin đơn hàng

5. **Sau khi đặt hàng**

   - Xóa giỏ hàng
   - Hiển thị thông báo thành công
   - Chuyển hướng đến trang đơn hàng

6. **Quản lý đơn hàng**
   - User xem danh sách đơn hàng tại `/customer/orders`
   - Xem chi tiết từng đơn hàng
   - Hủy đơn hàng (nếu chưa xử lý)

## Tính Năng Nổi Bật

### 1. Guest Checkout

- Cho phép đặt hàng không cần đăng nhập
- Chỉ cần thông tin giao hàng

### 2. Stock Management

- Tự động kiểm tra tồn kho khi đặt hàng
- Giảm tồn kho và tăng số lượng đã bán
- Hoàn lại tồn kho khi hủy đơn

### 3. Order Cancellation

- User có thể hủy đơn ở trạng thái pending/confirmed
- Tự động hoàn lại tồn kho

### 4. Shipping Fee

- Miễn phí vận chuyển cho đơn hàng >= 500,000 VNĐ
- Phí vận chuyển 30,000 VNĐ cho đơn hàng < 500,000 VNĐ

### 5. Order Snapshot

- Lưu tên sản phẩm và giá tại thời điểm đặt hàng
- Đảm bảo thông tin đơn hàng không thay đổi khi sản phẩm thay đổi

## Admin Functions

### 1. Quản Lý Đơn Hàng

Truy cập: `http://localhost:8000/admin/orders/order/`

Chức năng:

- Xem danh sách đơn hàng
- Cập nhật trạng thái đơn hàng
- Xem chi tiết đơn hàng và các items
- Filter theo trạng thái, phương thức thanh toán

### 2. Cập Nhật Trạng Thái

Các chuyển trạng thái hợp lệ:

- `pending` → `confirmed` hoặc `cancelled`
- `confirmed` → `processing` hoặc `cancelled`
- `processing` → `shipping` hoặc `cancelled`
- `shipping` → `delivered` hoặc `returned`

### 3. Thống Kê

API: `GET /api/orders/statistics/`

Thông tin:

- Tổng số đơn hàng
- Tổng doanh thu
- Thống kê theo trạng thái
- Thống kê theo phương thức thanh toán

## Lưu Ý

### Security

- Cần implement authentication/authorization cho production
- Validate input cẩn thận để tránh SQL injection
- Implement rate limiting cho API

### Performance

- Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
- Select_for_update để tránh race condition khi cập nhật stock
- Prefetch related items khi query orders

### User Experience

- Hiển thị loading state khi xử lý
- Thông báo lỗi rõ ràng
- Confirm dialog cho các hành động quan trọng
- Responsive design cho mobile

## Troubleshooting

### Lỗi "Không đủ tồn kho"

- Kiểm tra số lượng tồn kho trong database
- Đảm bảo product.stock > 0
- Chạy lại migrations nếu cần

### Lỗi CORS

- Thêm frontend URL vào `CORS_ALLOWED_ORIGINS` trong settings.py
- Kiểm tra `django-cors-headers` đã được cài đặt

### Giỏ hàng bị mất

- Giỏ hàng lưu trong LocalStorage
- Clear cache/cookies sẽ mất giỏ hàng
- Cần implement sync với backend nếu muốn persistent

## Tính Năng Có Thể Mở Rộng

1. **Payment Gateway Integration**

   - VNPay, Momo, ZaloPay
   - PayPal, Stripe

2. **Email Notifications**

   - Xác nhận đơn hàng
   - Cập nhật trạng thái
   - Hóa đơn điện tử

3. **Order Tracking**

   - Real-time tracking
   - SMS notifications
   - Timeline chi tiết

4. **Voucher/Discount System**

   - Mã giảm giá
   - Khuyến mãi
   - Loyalty points

5. **Advanced Features**
   - Đặt hàng lại
   - Đánh giá đơn hàng
   - Wishlist
   - Compare products

## Contact & Support

Nếu có vấn đề hoặc câu hỏi, vui lòng:

- Kiểm tra logs trong console/terminal
- Xem lại documentation
- Tạo issue trên GitHub
