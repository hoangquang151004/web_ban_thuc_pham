# Hướng Dẫn Trang Đơn Hàng (Orders Page)

## Tổng Quan

Trang đơn hàng đã được hoàn thiện với đầy đủ tính năng để khách hàng có thể quản lý và theo dõi đơn hàng của mình.

## Tính Năng Chính

### 1. Tabs Lọc Đơn Hàng

- **Tất cả**: Hiển thị tất cả đơn hàng
- **Chờ xác nhận**: Đơn hàng đang chờ shop xác nhận (status: pending)
- **Đang xử lý**: Đơn hàng đã xác nhận và đang xử lý (status: confirmed, processing)
- **Đang giao**: Đơn hàng đang được vận chuyển (status: shipping)
- **Đã giao**: Đơn hàng đã giao thành công (status: delivered)
- **Đã hủy**: Đơn hàng đã bị hủy hoặc hoàn trả (status: cancelled, returned)

### 2. Badge Số Lượng

- Mỗi tab hiển thị số lượng đơn hàng với màu sắc tương ứng
- Cập nhật tự động khi có thay đổi

### 3. DataTable

- **Hiển thị thông tin**:
  - Mã đơn hàng
  - Ngày đặt
  - Trạng thái (với tag màu sắc)
  - Phương thức thanh toán
  - Tổng tiền
- **Tính năng**:
  - Phân trang (10 đơn/trang)
  - Sắp xếp theo các cột
  - Responsive design

### 4. Actions (Thao Tác)

- **Xem chi tiết**: Nút icon "mắt" để xem chi tiết đơn hàng
- **Hủy đơn**: Nút icon "X" màu đỏ (chỉ hiển thị với đơn pending/confirmed)

### 5. Dialog Chi Tiết Đơn Hàng

#### A. Timeline Trạng Thái

- Hiển thị trực quan tiến trình đơn hàng
- Các trạng thái:
  1. **Đặt hàng** (màu tím) - Khi đơn được tạo
  2. **Đã xác nhận** (màu xám) - Shop xác nhận
  3. **Đang xử lý** (màu cam) - Đang chuẩn bị hàng
  4. **Đang giao hàng** (màu xanh dương) - Đang vận chuyển
  5. **Đã giao hàng** (màu xanh lá) - Hoàn thành
  - Hoặc **Đã hủy** (màu đỏ) / **Đã hoàn trả** (màu nâu)

#### B. Thông Tin Đơn Hàng (Cột Trái)

- Mã đơn hàng
- Ngày đặt hàng
- Phương thức thanh toán
- Trạng thái thanh toán (với tag màu)
- Ghi chú (nếu có)

#### C. Thông Tin Người Nhận

- Họ tên
- Số điện thoại
- Email (nếu có)
- Địa chỉ đầy đủ

#### D. Danh Sách Sản Phẩm (Cột Phải)

- Tên sản phẩm
- Giá × Số lượng
- Thành tiền
- Tạm tính
- Phí vận chuyển (hiển thị "Miễn phí" nếu = 0)
- **Tổng cộng** (nổi bật)

#### E. Nút Hành Động

- **Hủy đơn hàng**: Hiển thị nếu đơn ở trạng thái pending/confirmed
- **Thông báo thành công**: Hiển thị nếu đơn đã giao

### 6. Empty State

- Hiển thị khi chưa có đơn hàng
- Icon túi mua sắm lớn
- Thông báo "Bạn chưa có đơn hàng nào"
- Nút "Mua sắm ngay" dẫn đến trang sản phẩm

### 7. Loading State

- Hiển thị spinner khi đang tải dữ liệu
- Thông báo "Đang tải danh sách đơn hàng..."

## Cấu Trúc File

```
frontend/app/(main)/customer/orders/
├── page.tsx              # Component chính
└── orders.module.css     # Custom styling
```

## API Endpoints Sử Dụng

### 1. Lấy Danh Sách Đơn Hàng

```
GET /api/orders/
GET /api/orders/?status=pending
```

### 2. Lấy Chi Tiết Đơn Hàng

```
GET /api/orders/{id}/
```

### 3. Hủy Đơn Hàng

```
POST /api/orders/{id}/cancel/
```

## Interfaces TypeScript

```typescript
interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  order_number: string;
  user: number | null;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  city: string;
  note: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipping"
    | "delivered"
    | "cancelled"
    | "returned";
  status_display: string;
  payment_method: "cod" | "vnpay" | "momo" | "banking";
  payment_method_display: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_status_display: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
}
```

## Trạng Thái & Màu Sắc

| Trạng thái | Label        | Màu Tag              | Icon Timeline          |
| ---------- | ------------ | -------------------- | ---------------------- |
| pending    | Chờ xác nhận | warning (vàng)       | pi-shopping-cart (tím) |
| confirmed  | Đã xác nhận  | info (xanh nhạt)     | pi-check-circle (xám)  |
| processing | Đang xử lý   | info (xanh nhạt)     | pi-cog (cam)           |
| shipping   | Đang giao    | primary (xanh dương) | pi-truck (xanh)        |
| delivered  | Đã giao      | success (xanh lá)    | pi-check (xanh lá)     |
| cancelled  | Đã hủy       | danger (đỏ)          | pi-times-circle (đỏ)   |
| returned   | Đã hoàn      | secondary (xám)      | pi-replay (nâu)        |

## Quy Tắc Nghiệp Vụ

### Hủy Đơn Hàng

- Chỉ có thể hủy đơn ở trạng thái **pending** hoặc **confirmed**
- Khi hủy, backend sẽ tự động hoàn lại số lượng tồn kho
- Hiển thị dialog xác nhận trước khi hủy

### Timeline

- Hiển thị các bước đã hoàn thành và bước hiện tại
- Với đơn đã hủy/hoàn trả, timeline sẽ dừng ở bước đó

### Phí Vận Chuyển

- Miễn phí nếu đơn hàng >= 500.000đ
- 30.000đ nếu đơn hàng < 500.000đ
- Hiển thị "Miễn phí" màu xanh trong chi tiết đơn

## Responsive Design

### Desktop (> 992px)

- Dialog rộng 1000px
- Layout 2 cột trong chi tiết đơn
- Timeline hiển thị alternate

### Tablet (768px - 992px)

- Dialog tự động co lại
- Layout stack dọc
- Giữ nguyên các tính năng

### Mobile (< 768px)

- Dialog full width
- Timeline hiển thị dọc
- DataTable scroll ngang
- Các cột thu gọn

## Cài Đặt & Sử Dụng

### 1. Import API Service

```typescript
import { orderAPI } from "@/services/api";
```

### 2. Fetch Orders

```typescript
const data = await orderAPI.getAll();
// hoặc với filter
const data = await orderAPI.getAll({ status: "pending" });
```

### 3. Cancel Order

```typescript
await orderAPI.cancel(orderId);
```

## Toast Messages

### Success

- "Đơn hàng đã được hủy thành công"

### Error

- "Không thể tải danh sách đơn hàng"
- "Không thể hủy đơn hàng"

## Authentication

- Trang này yêu cầu đăng nhập
- Token được lấy từ localStorage: `access_token`
- Tự động thêm vào header: `Authorization: Bearer {token}`

## Tương Lai - Tính Năng Có Thể Thêm

1. **Đánh giá sản phẩm**: Sau khi nhận hàng
2. **In đơn hàng**: Export PDF
3. **Tracking realtime**: WebSocket updates
4. **Lọc nâng cao**: Theo ngày, giá, phương thức thanh toán
5. **Export Excel**: Xuất danh sách đơn hàng
6. **Chat với shop**: Hỏi về đơn hàng
7. **Mua lại**: Đặt lại đơn hàng cũ
8. **Lịch sử thay đổi**: Xem log thay đổi trạng thái

## Troubleshooting

### Lỗi: "Không thể tải danh sách đơn hàng"

- Kiểm tra backend đã chạy chưa
- Kiểm tra token còn hợp lệ không
- Xem console log để biết chi tiết

### Timeline không hiển thị đúng

- Kiểm tra dữ liệu `confirmed_at`, `delivered_at`
- Kiểm tra status của đơn hàng

### Dialog không mở

- Kiểm tra `selectedOrder` có data không
- Kiểm tra `detailDialog` state

## Notes

- Trang này hoạt động độc lập với authentication
- Data được fetch từ API mỗi khi component mount
- Sử dụng PrimeReact components cho UI consistency
- CSS module để tránh conflict styles
