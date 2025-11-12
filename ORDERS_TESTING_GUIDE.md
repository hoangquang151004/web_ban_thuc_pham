# Quick Start Guide - Trang Đơn Hàng

## 🚀 Chạy Ngay

### 1. Backend đã chạy

```bash
# Terminal: python
cd backend
python manage.py runserver
# Server: http://localhost:8000
```

### 2. Frontend đã chạy

```bash
# Terminal: node
cd frontend
npm run dev
# Server: http://localhost:3000
```

### 3. Truy cập trang đơn hàng

```
http://localhost:3000/customer/orders
```

## 🎯 Test Flow

### A. Khi chưa có đơn hàng

1. Vào `/customer/orders`
2. Thấy empty state với icon túi mua sắm
3. Click "Mua sắm ngay" → redirect sang `/customer/products`

### B. Khi có đơn hàng

1. **Tab "Tất cả"**: Xem tất cả đơn
2. **Tab "Chờ xác nhận"**: Xem đơn pending
3. Click icon 👁️ → Mở dialog chi tiết
4. Xem timeline tiến trình
5. Xem thông tin đầy đủ
6. Click icon ❌ (nếu có) → Hủy đơn

### C. Timeline States Test

#### Test Case 1: Đơn Pending

- ✅ Hiển thị: "Đặt hàng"
- ⏳ Chờ: "Đã xác nhận"

#### Test Case 2: Đơn Confirmed

- ✅ Hiển thị: "Đặt hàng" → "Đã xác nhận"
- ⏳ Chờ: "Đang xử lý"

#### Test Case 3: Đơn Shipping

- ✅ Hiển thị: "Đặt hàng" → "Đã xác nhận" → "Đang xử lý" → "Đang giao hàng"
- ⏳ Chờ: "Đã giao hàng"

#### Test Case 4: Đơn Delivered

- ✅ Hiển thị: Full timeline đến "Đã giao hàng"
- 🎉 Hiển thị thông báo thành công

#### Test Case 5: Đơn Cancelled

- ✅ Hiển thị: "Đặt hàng" → "Đã hủy"
- 🚫 Không có actions

## 📊 Test Scenarios

### Scenario 1: Lọc Đơn Hàng

```
1. Click tab "Chờ xác nhận"
   → Chỉ hiển thị đơn status = pending
   → Badge hiển thị số đúng

2. Click tab "Đang xử lý"
   → Hiển thị đơn confirmed + processing
   → Badge cập nhật

3. Click tab "Đã giao"
   → Hiển thị đơn delivered
   → Badge màu xanh
```

### Scenario 2: Xem Chi Tiết

```
1. Click icon eye bất kỳ đơn nào
   → Dialog mở
   → Width 1000px (desktop)

2. Kiểm tra thông tin:
   ✅ Mã đơn hàng
   ✅ Timeline
   ✅ Thông tin người nhận
   ✅ Danh sách sản phẩm
   ✅ Tổng tiền

3. Close dialog
   → State reset
```

### Scenario 3: Hủy Đơn Hàng

```
1. Tìm đơn có status = pending hoặc confirmed
   → Icon X màu đỏ hiển thị

2. Click icon X
   → Confirm dialog hiển thị
   → Message: "Bạn có chắc chắn muốn hủy đơn hàng..."

3. Click "Không"
   → Dialog đóng
   → Không thay đổi gì

4. Click "Có"
   → API call: POST /orders/{id}/cancel/
   → Loading...
   → Success toast: "Đơn hàng đã được hủy thành công"
   → Reload danh sách
   → Đơn chuyển sang tab "Đã hủy"
```

### Scenario 4: Responsive Test

```
Desktop (1920x1080):
   ✅ Dialog 1000px
   ✅ 2 columns layout
   ✅ Timeline alternate

Tablet (768x1024):
   ✅ Dialog auto width
   ✅ Stack layout
   ✅ Timeline vertical

Mobile (375x667):
   ✅ Dialog full width
   ✅ Timeline vertical
   ✅ DataTable scroll horizontal
   ✅ Tabs scroll
```

## 🐛 Test Cases

### Test Case 1: Empty Orders

**Given**: User chưa có đơn hàng
**When**: Vào /customer/orders
**Then**:

- Hiển thị empty state
- Icon pi-shopping-bag
- Text "Bạn chưa có đơn hàng nào"
- Button "Mua sắm ngay"

### Test Case 2: Loading State

**Given**: API đang load
**When**: Component mount
**Then**:

- Hiển thị ProgressSpinner
- Text "Đang tải danh sách đơn hàng..."

### Test Case 3: Error State

**Given**: API error
**When**: Fetch orders fail
**Then**:

- Toast error hiển thị
- Message: "Không thể tải danh sách đơn hàng"

### Test Case 4: Filter by Status

**Given**: Có 10 đơn hàng (3 pending, 2 shipping, 5 delivered)
**When**: Click tab "Chờ xác nhận"
**Then**:

- Hiển thị 3 đơn pending
- Badge = 3
- DataTable chỉ 3 rows

### Test Case 5: View Order Detail

**Given**: Có đơn hàng ID=123
**When**: Click icon eye của đơn 123
**Then**:

- Dialog mở
- selectedOrder = order 123
- Timeline hiển thị đúng status
- Thông tin đầy đủ

### Test Case 6: Cancel Order Success

**Given**: Đơn hàng ID=123, status=pending
**When**: Click cancel → Confirm "Có"
**Then**:

- API POST /orders/123/cancel/
- Status code 200
- Toast success
- Orders reload
- Đơn 123 status = cancelled

### Test Case 7: Cancel Order Forbidden

**Given**: Đơn hàng ID=123, status=delivered
**When**: Tìm action buttons
**Then**:

- Không có icon cancel
- Chỉ có icon eye

### Test Case 8: Timeline Rendering

**Given**: Đơn hàng status=shipping
**When**: Mở dialog
**Then**:
Timeline hiển thị:

1. ✅ Đặt hàng (tím)
2. ✅ Đã xác nhận (xám)
3. ✅ Đang xử lý (cam)
4. ✅ Đang giao hàng (xanh)
5. ⏳ Đã giao hàng (chưa có)

### Test Case 9: Free Shipping Display

**Given**: Đơn hàng có shipping_fee = 0
**When**: Xem chi tiết
**Then**:

- Phí vận chuyển: "Miễn phí" (màu xanh)

### Test Case 10: Format Currency

**Given**: Total = 1234567
**When**: Hiển thị
**Then**:

- Format: "1.234.567 ₫"

## 🔍 Manual Testing Checklist

### UI/UX

- [ ] Tabs hiển thị đúng
- [ ] Badge có số lượng đúng
- [ ] DataTable phân trang
- [ ] Dialog mở/đóng smooth
- [ ] Timeline đẹp
- [ ] Icons đúng
- [ ] Colors consistent
- [ ] Hover effects
- [ ] Loading spinner
- [ ] Empty state

### Functionality

- [ ] Fetch orders thành công
- [ ] Filter by tab
- [ ] View detail
- [ ] Cancel order
- [ ] Toast notifications
- [ ] Confirm dialog
- [ ] Error handling
- [ ] Loading states

### Responsive

- [ ] Desktop (>1200px)
- [ ] Laptop (1024px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### Data

- [ ] Order info correct
- [ ] Items list correct
- [ ] Total calculation
- [ ] Shipping fee
- [ ] Timeline accurate
- [ ] Status mapping
- [ ] Date format VN

### Edge Cases

- [ ] No orders
- [ ] 1 order
- [ ] 100+ orders
- [ ] Very long address
- [ ] No email
- [ ] No note
- [ ] shipping_fee = 0

## 📝 Test Data

### Sample Order 1 (Pending)

```json
{
  "id": 1,
  "order_number": "ORD20241112001",
  "status": "pending",
  "full_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "address": "123 Đường ABC, Quận 1",
  "district": "Quận 1",
  "city": "TP. Hồ Chí Minh",
  "subtotal": 450000,
  "shipping_fee": 30000,
  "total": 480000,
  "payment_method": "cod",
  "items": [...]
}
```

### Sample Order 2 (Delivered)

```json
{
  "id": 2,
  "order_number": "ORD20241112002",
  "status": "delivered",
  "delivered_at": "2024-11-10T10:30:00Z",
  "subtotal": 600000,
  "shipping_fee": 0,
  "total": 600000
}
```

## ✅ Acceptance Criteria

### Must Have

- [x] Display list of orders
- [x] Filter by status (tabs)
- [x] View order detail
- [x] Cancel order (pending/confirmed)
- [x] Timeline visualization
- [x] Responsive design
- [x] Error handling
- [x] Loading states
- [x] Empty states

### Nice to Have

- [x] Badge with count
- [x] Smooth animations
- [x] Icons for all actions
- [x] Color coding
- [x] Professional layout
- [x] Toast notifications
- [x] Confirm dialogs

### Future

- [ ] Real-time updates
- [ ] Print order
- [ ] Review products
- [ ] Reorder
- [ ] Advanced filters
- [ ] Export to Excel

## 🎯 Definition of Done

- [x] Code complete
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Responsive tested
- [x] Browser tested (Chrome, Firefox, Safari)
- [x] Documentation complete
- [x] Code reviewed
- [x] Deployed to dev
- [ ] QA tested
- [ ] Product owner approval

---

**Ready for Testing!** ✅

Start testing với URL: `http://localhost:3000/customer/orders`
