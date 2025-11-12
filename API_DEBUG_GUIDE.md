# Test API Connection

## Kiểm Tra Backend

### 1. Backend có đang chạy không?

Mở terminal và chạy:

```bash
cd backend
python manage.py runserver
```

Backend phải chạy tại: `http://localhost:8000`

### 2. Test API trực tiếp

Mở browser hoặc Postman và test:

**Test 1: Health check**

```
GET http://localhost:8000/admin/
```

Phải thấy Django admin login page

**Test 2: Test Orders endpoint**

```
POST http://localhost:8000/api/orders/
Content-Type: application/json

{
  "full_name": "Test User",
  "phone": "0901234567",
  "email": "test@example.com",
  "address": "123 Test Street",
  "district": "Test District",
  "city": "Test City",
  "note": "",
  "payment_method": "cod",
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    }
  ]
}
```

### 3. Check Console Logs

Khi gặp lỗi, mở Developer Console trong browser (F12) và check:

**Console Tab:**

- Xem log "Creating order with data:"
- Xem log "API URL:"
- Xem log "Response status:"

**Network Tab:**

- Tìm request đến `/api/orders/`
- Check Status Code
- Check Response

## Các Lỗi Thường Gặp

### Lỗi: "Unexpected token '<', "<!DOCTYPE"..."

**Nguyên nhân:**

- Backend không chạy
- URL API sai
- CORS issue
- Django trả về HTML error page thay vì JSON

**Cách fix:**

1. **Check backend đang chạy:**

   ```bash
   # Terminal backend
   python manage.py runserver
   ```

   Phải thấy: "Starting development server at http://127.0.0.1:8000/"

2. **Check URL trong frontend:**

   - File: `.env.local`

   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

   - Restart frontend sau khi thay đổi .env

3. **Check có product trong database:**

   ```bash
   python manage.py shell
   ```

   ```python
   from products.models import Product
   print(Product.objects.all())
   ```

   Phải có ít nhất 1 product

4. **Check migrations:**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Check CORS settings:**
   File: `backend/backend/settings.py`
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
   ]
   ```

### Lỗi: "Product not found"

**Cách fix:**

```bash
# Tạo sample data
cd backend
python create_sample_data.py
```

### Lỗi: "Not enough stock"

**Cách fix:**

- Check stock của product trong admin
- Tăng stock number

## Quick Debug Steps

1. **Terminal 1 - Backend:**

   ```bash
   cd backend
   python manage.py runserver
   ```

   Để terminal này chạy

2. **Terminal 2 - Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

   Để terminal này chạy

3. **Browser:**

   - Mở http://localhost:3000
   - F12 để mở DevTools
   - Vào tab Console
   - Thử checkout
   - Xem logs

4. **Check backend terminal:**
   - Xem có request nào đến không
   - Xem có error nào không

## Test với Curl

```bash
# Test tạo order
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "phone": "0901234567",
    "email": "test@example.com",
    "address": "123 Test",
    "district": "Q1",
    "city": "HCM",
    "note": "",
    "payment_method": "cod",
    "items": [{"product_id": 1, "quantity": 1}]
  }'
```

## Kiểm Tra Database

```bash
python manage.py shell
```

```python
# Check products
from products.models import Product
products = Product.objects.all()
print(f"Total products: {products.count()}")
for p in products:
    print(f"- {p.name}: Stock={p.stock}, Price={p.price}")

# Check orders
from orders.models import Order
orders = Order.objects.all()
print(f"\nTotal orders: {orders.count()}")
for o in orders:
    print(f"- {o.order_number}: {o.status}")
```

## Checklist

- [ ] Backend đang chạy (port 8000)
- [ ] Frontend đang chạy (port 3000)
- [ ] Database có products
- [ ] Products có stock > 0
- [ ] CORS được config đúng
- [ ] .env.local có NEXT_PUBLIC_API_URL
- [ ] Browser console không có CORS error
- [ ] Network tab thấy request đến đúng URL
