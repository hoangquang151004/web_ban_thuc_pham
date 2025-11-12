# Cập Nhật Trang Thanh Toán - Auto-fill User Info

## Các Thay Đổi

### 1. Tự Động Điền Thông Tin User

Trang checkout giờ đây tự động lấy thông tin từ user profile nếu đã đăng nhập:

**Thông tin được tự động điền:**

- ✅ Họ và tên (`full_name`)
- ✅ Số điện thoại (`phone`)
- ✅ Email (`email`)
- ✅ Địa chỉ (`address`)

**Cách hoạt động:**

- Khi user đã đăng nhập, thông tin được lưu trong `localStorage` với key `user`
- Component sẽ load thông tin này khi mount và tự động điền vào form
- User vẫn có thể chỉnh sửa thông tin nếu muốn

### 2. Gửi Token khi Tạo Đơn Hàng

- API call giờ đây bao gồm `Authorization` header nếu user đã đăng nhập
- Backend sẽ gán đơn hàng cho user đó
- Vẫn hỗ trợ guest checkout (không cần đăng nhập)

### 3. Cải Thiện UX

#### Loading State

- Hiển thị spinner khi đang load thông tin user
- Đảm bảo form chỉ hiển thị khi đã load xong

#### Visual Feedback

- Badge thông báo "Thông tin được lấy từ tài khoản của bạn" khi có user info
- Thông báo khuyên user đăng nhập nếu chưa đăng nhập
- Placeholder text rõ ràng cho từng field

#### Form Fields

- Tất cả fields đều có placeholder text
- Required fields được đánh dấu rõ ràng (\*)
- Ghi chú có ví dụ cụ thể

## Code Changes

### Checkout Page (`checkout/page.tsx`)

```typescript
// Load user info from localStorage
useEffect(() => {
  const loadUserInfo = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          fullName: user.full_name || "",
          phone: user.phone || "",
          email: user.email || "",
          address: user.address || "",
        }));
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    } finally {
      setLoadingUserInfo(false);
    }
  };

  loadUserInfo();
}, []);
```

### API Call với Authorization

```typescript
// Gửi token nếu user đã đăng nhập
const token = localStorage.getItem("access_token");
const headers: HeadersInit = {
  "Content-Type": "application/json",
};

if (token) {
  headers["Authorization"] = `Bearer ${token}`;
}

const response = await fetch(`${API_BASE_URL}/api/orders/`, {
  method: "POST",
  headers,
  body: JSON.stringify(orderData),
});
```

## Testing

### Test Case 1: User Đã Đăng Nhập

1. Đăng nhập vào hệ thống
2. Thêm sản phẩm vào giỏ hàng
3. Vào trang checkout
4. ✅ Thông tin user (họ tên, SĐT, email, địa chỉ) được tự động điền
5. ✅ Hiển thị badge "Thông tin được lấy từ tài khoản của bạn"
6. ✅ User có thể chỉnh sửa thông tin
7. Đặt hàng thành công
8. ✅ Đơn hàng được gán cho user đó

### Test Case 2: Guest Checkout

1. **Không** đăng nhập
2. Thêm sản phẩm vào giỏ hàng
3. Vào trang checkout
4. ✅ Form trống
5. ✅ Hiển thị thông báo khuyên đăng nhập
6. Điền thông tin thủ công
7. Đặt hàng thành công
8. ✅ Đơn hàng được tạo với `user = null`

### Test Case 3: Chỉnh Sửa Thông Tin

1. Đăng nhập vào hệ thống
2. Vào trang checkout
3. ✅ Thông tin tự động điền
4. Chỉnh sửa một số field (VD: đổi địa chỉ giao hàng)
5. Đặt hàng
6. ✅ Đơn hàng dùng thông tin đã chỉnh sửa
7. ✅ Thông tin profile của user không thay đổi

## User Experience Flow

### Logged In User

```
1. User đăng nhập
   ↓
2. LocalStorage lưu user info
   ↓
3. User browse products → Add to cart
   ↓
4. User click "Thanh toán"
   ↓
5. Checkout page loads
   ↓
6. useEffect loads user info from localStorage
   ↓
7. Form auto-filled với user data
   ↓
8. User review/edit info
   ↓
9. Click "Đặt hàng"
   ↓
10. API call với Authorization header
   ↓
11. Backend gán order cho user
   ↓
12. Success → Clear cart → Redirect
```

### Guest User

```
1. User browse products (no login)
   ↓
2. Add to cart
   ↓
3. Click "Thanh toán"
   ↓
4. Empty form
   ↓
5. See tip: "Đăng nhập để auto-fill"
   ↓
6. Fill form manually
   ↓
7. Click "Đặt hàng"
   ↓
8. API call without token
   ↓
9. Backend creates order with user=null
   ↓
10. Success → Clear cart → Redirect
```

## Benefits

### For Logged-In Users

- ⚡ **Faster checkout** - Không cần gõ lại thông tin
- ✅ **Accurate info** - Dùng thông tin đã verify trong profile
- 📋 **Order history** - Đơn hàng được link với account
- 🔄 **Re-order easily** - Dễ dàng đặt lại đơn hàng cũ

### For Guest Users

- 🚀 **Quick purchase** - Không bắt buộc phải đăng ký
- 🔒 **Privacy** - Không cần tạo account
- ⚡ **Fast** - Nhập thông tin và đặt hàng ngay

### For Business

- 📈 **Higher conversion** - Giảm friction trong checkout
- 💰 **More sales** - Hỗ trợ cả guest checkout
- 📊 **Better data** - Track orders của registered users
- 🎯 **Targeted marketing** - Biết ai mua gì

## Technical Details

### Data Structure

**User Object in LocalStorage:**

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "phone": "0901234567",
  "role": "customer",
  "address": "123 Nguyen Van Linh, Q7",
  "avatar": null,
  "is_active": true
}
```

**Order API Request:**

```json
{
  "full_name": "John Doe",
  "phone": "0901234567",
  "email": "john@example.com",
  "address": "123 Nguyen Van Linh",
  "district": "Quan 7",
  "city": "TP. Ho Chi Minh",
  "note": "Giao gio hanh chinh",
  "payment_method": "cod",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

## Future Improvements

1. **Multiple Addresses**

   - Cho phép user lưu nhiều địa chỉ
   - Dropdown chọn địa chỉ đã lưu
   - Quick add new address

2. **Address Validation**

   - Validate địa chỉ với Google Maps API
   - Auto-suggest quận/huyện, tỉnh/thành phố
   - Tính phí ship chính xác theo địa chỉ

3. **Save Address Option**

   - Checkbox "Lưu địa chỉ này vào profile"
   - Tự động update user profile nếu chọn

4. **Default Address**

   - User chọn một địa chỉ làm mặc định
   - Auto-load default address

5. **Order as Guest with Email**
   - Guest nhập email
   - Gửi link track order qua email
   - Option để convert guest order thành account

## Notes

- Thông tin trong form **không tự động update** vào user profile
- Nếu muốn update profile, user phải vào trang Profile settings
- Token được lưu với key `access_token` trong localStorage
- User info được lưu với key `user` trong localStorage

## Troubleshooting

### Thông tin không tự động điền

- Check localStorage có key `user` không
- Check format của user object
- Check console có error không

### Token không được gửi

- Check localStorage có key `access_token` không
- Check token còn valid không
- Check header format: `Authorization: Bearer <token>`

### Order không gán cho user

- Check token có được gửi không
- Check backend authentication middleware
- Check user có active không
