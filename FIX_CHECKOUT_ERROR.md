# 🔧 FIX LỖI: "Unexpected token '<', "<!DOCTYPE"..."

## ✅ ĐÃ SỬA

### Vấn đề

API URL bị duplicate `/api`:

- .env.local: `http://localhost:8000/api`
- Code: `${API_BASE_URL}/api/orders/`
- Kết quả: `http://localhost:8000/api/api/orders/` ❌

### Giải pháp

Sửa file `.env.local`:

```bash
# Trước (SAI)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Sau (ĐÚNG)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚀 Cách Chạy Lại

### Bước 1: Restart Frontend

```bash
# Stop frontend (Ctrl+C trong terminal)
# Sau đó chạy lại:
cd frontend
npm run dev
```

**Quan trọng:** Phải restart sau khi thay đổi file `.env.local`

### Bước 2: Check Backend Đang Chạy

```bash
# Terminal khác
cd backend
python manage.py runserver
```

Phải thấy: `Starting development server at http://127.0.0.1:8000/`

### Bước 3: Test Lại

1. Mở browser: http://localhost:3000
2. Thêm sản phẩm vào giỏ hàng
3. Vào trang checkout
4. Điền thông tin và đặt hàng
5. F12 → Console để xem logs

## 🔍 Debug Logs Đã Thêm

Khi click "Đặt hàng", check Console sẽ thấy:

```
Creating order with data: {...}
API URL: http://localhost:8000/api/orders/
Sending with auth token (hoặc No auth token - guest checkout)
Response status: 201
```

## ❌ Các Lỗi Khác Có Thể Gặp

### 1. Backend không chạy

**Lỗi:** Network error / Failed to fetch

**Fix:**

```bash
cd backend
python manage.py runserver
```

### 2. Không có sản phẩm trong database

**Lỗi:** "Sản phẩm với ID X không tồn tại"

**Fix:**

```bash
cd backend
python create_sample_data.py
```

### 3. Sản phẩm hết hàng

**Lỗi:** "Sản phẩm 'X' chỉ còn 0 trong kho"

**Fix:**

- Vào Admin: http://localhost:8000/admin/
- Products → Chọn sản phẩm → Tăng Stock
- Hoặc chạy lại create_sample_data.py

### 4. CORS Error

**Lỗi:** "Access to fetch... has been blocked by CORS policy"

**Fix:** Check file `backend/backend/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### 5. Port đã được sử dụng

**Lỗi:** "Port 8000 is already in use"

**Fix Windows:**

```bash
# Tìm process đang dùng port 8000
netstat -ano | findstr :8000

# Kill process (thay PID)
taskkill /PID [PID_NUMBER] /F
```

**Fix Mac/Linux:**

```bash
# Tìm và kill process
lsof -ti:8000 | xargs kill -9
```

## ✅ Checklist Trước Khi Test

- [ ] Backend chạy ở port 8000
- [ ] Frontend chạy ở port 3000
- [ ] File `.env.local` đã được sửa (không có `/api` ở cuối)
- [ ] Đã restart frontend sau khi sửa .env
- [ ] Database có products với stock > 0
- [ ] Browser console không có CORS error

## 📝 Test Cases

### Test 1: Guest Checkout

1. **Không** đăng nhập
2. Thêm sản phẩm vào giỏ
3. Checkout → Điền thông tin
4. Đặt hàng
5. ✅ Phải thành công

### Test 2: Logged In User

1. Đăng nhập
2. Thêm sản phẩm vào giỏ
3. Checkout → Thông tin tự động điền
4. Đặt hàng
5. ✅ Phải thành công

### Test 3: Validation

1. Checkout với giỏ hàng trống
2. ✅ Phải chuyển về trang giỏ hàng
3. Checkout với thông tin thiếu
4. ✅ Phải hiện warning

## 🎯 Expected Console Output

### Success:

```
Creating order with data: {full_name: "...", phone: "...", ...}
API URL: http://localhost:8000/api/orders/
No auth token - guest checkout
Response status: 201
Response headers: Headers {...}
```

### Error (Backend không chạy):

```
Creating order with data: {...}
API URL: http://localhost:8000/api/orders/
Failed to fetch
```

### Error (Product không tồn tại):

```
Creating order with data: {...}
API URL: http://localhost:8000/api/orders/
Response status: 400
Lỗi: Sản phẩm với ID 1 không tồn tại hoặc đã ngừng bán
```

## 🔗 URLs Quan Trọng

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Django Admin: http://localhost:8000/admin/
- API Orders: http://localhost:8000/api/orders/
- Cart Page: http://localhost:3000/customer/cart
- Checkout: http://localhost:3000/customer/checkout
- Orders: http://localhost:3000/customer/orders

## 💡 Tips

1. **Luôn check cả 2 terminals** (backend và frontend)
2. **Mở DevTools (F12)** để xem logs chi tiết
3. **Check Network tab** để xem request/response
4. **Restart frontend** sau khi thay đổi .env
5. **Check backend terminal** để xem có request đến không
