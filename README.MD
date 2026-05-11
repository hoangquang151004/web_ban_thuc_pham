# Web Bán Thực Phẩm

Dự án cung cấp nền tảng bán thực phẩm trực tuyến với backend Django và frontend Next.js. Hệ thống hỗ trợ quản lý sản phẩm, danh mục, đơn hàng, đánh giá và tích hợp thanh toán.

## Công nghệ sử dụng

- Backend: Django 5, Django REST Framework, JWT (SimpleJWT), Django Filter, CORS
- Cơ sở dữ liệu: MySQL (mysqlclient), hỗ trợ `DATABASE_URL` qua `dj-database-url`
- Media: Pillow (xử lý ảnh), Whitenoise (static)
- Frontend: Next.js + TypeScript
- Khác: requests, python-dotenv, gunicorn

## Chức năng chính

- Quản lý người dùng và phân quyền (admin/khách hàng)
- Quản lý danh mục và sản phẩm
- Tìm kiếm, lọc, phân trang dữ liệu
- Đánh giá sản phẩm
- Đơn hàng và theo dõi trạng thái
- Tích hợp thanh toán VNPay và MoMo
- Upload ảnh sản phẩm

## Hướng dẫn chạy dự án

### 1) Backend (Django)

**Yêu cầu**

- Python 3.10+
- MySQL (nếu dùng DB Engine mặc định)

**Cài đặt**

```bash
cd web_ban_thuc_pham/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**Tạo file .env** (đặt tại thư mục `web_ban_thuc_pham/backend/.env`)

```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Database (MySQL)
DB_NAME=food_store_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# Hoặc dùng DATABASE_URL / MYSQL_URL nếu có
# DATABASE_URL=mysql://user:password@host:3306/dbname

# VNPay
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/customer/payment/vnpay-return

# MoMo
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:3000/customer/payment/momo-return
MOMO_NOTIFY_URL=http://localhost:8000/api/orders/momo_ipn/
```

**Chạy migrate và server**

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend mặc định chạy tại: http://localhost:8000

### 2) Frontend (Next.js)

```bash
cd web_ban_thuc_pham/frontend
npm install
npm run dev
```

Frontend mặc định chạy tại: http://localhost:3000

## Ghi chú

- Nếu dùng Database khác, cần cập nhật `DB_ENGINE` và thông tin kết nối trong .env.
- Khi triển khai production, cần đổi `DEBUG=False` và khai báo `ALLOWED_HOSTS` đúng môi trường.

# Thanh toán bằng momo

Thông tin thẻ test (ATM) để kiểm tra luồng thanh toán MoMo:

| No  | Tên          | Số thẻ              | Hạn ghi trên thẻ | OTP | Trường hợp test     |
| --- | ------------ | ------------------- | ---------------- | --- | ------------------- |
| 1   | NGUYEN VAN A | 9704 0000 0000 0018 | 03/07            | OTP | Thành công          |
| 2   | NGUYEN VAN A | 9704 0000 0000 0026 | 03/07            | OTP | Thẻ bị khóa         |
| 3   | NGUYEN VAN A | 9704 0000 0000 0034 | 03/07            | OTP | Nguồn tiền không đủ |
| 4   | NGUYEN VAN A | 9704 0000 0000 0042 | 03/07            | OTP | Hạn mức thẻ         |
