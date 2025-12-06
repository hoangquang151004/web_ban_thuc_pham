"""
VNPay Payment Integration
Documentation: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
"""
import hashlib
import hmac
import urllib.parse
from datetime import datetime
from typing import Dict, Optional


class VNPay:
    """VNPay Payment Gateway Handler"""
    
    def __init__(
        self,
        vnp_tmn_code: str,
        vnp_hash_secret: str,
        vnp_url: str,
        vnp_return_url: str
    ):
        """
        Initialize VNPay configuration
        
        Args:
            vnp_tmn_code: VNPay Terminal/Merchant Code (Mã website)
            vnp_hash_secret: VNPay Hash Secret Key
            vnp_url: VNPay Payment URL
            vnp_return_url: Return URL after payment
        """
        self.vnp_tmn_code = vnp_tmn_code
        self.vnp_hash_secret = vnp_hash_secret
        self.vnp_url = vnp_url
        self.vnp_return_url = vnp_return_url
    
    def create_payment_url(
        self,
        order_id: str,
        amount: float,
        order_desc: str,
        order_type: str = 'other',
        language: str = 'vn',
        bank_code: Optional[str] = None,
        ip_address: str = '127.0.0.1'
    ) -> str:
        """
        Tạo URL thanh toán VNPay
        
        Args:
            order_id: Mã đơn hàng
            amount: Số tiền (VNĐ)
            order_desc: Mô tả đơn hàng
            order_type: Loại đơn hàng (mặc định: 'other')
            language: Ngôn ngữ (vn/en)
            bank_code: Mã ngân hàng (nếu có)
            ip_address: IP address của khách hàng
        
        Returns:
            URL thanh toán VNPay
        """
        # Tạo request data
        vnp_params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': self.vnp_tmn_code,
            'vnp_Amount': int(amount * 100),  # VNPay yêu cầu amount * 100
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': order_id,
            'vnp_OrderInfo': order_desc,
            'vnp_OrderType': order_type,
            'vnp_Locale': language,
            'vnp_ReturnUrl': self.vnp_return_url,
            'vnp_IpAddr': ip_address,
            'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S')
        }
        
        # Thêm bank code nếu có
        if bank_code:
            vnp_params['vnp_BankCode'] = bank_code
        
        # Sắp xếp params theo key
        sorted_params = sorted(vnp_params.items())
        
        # Tạo hash data (không encode)
        hash_data = '&'.join([f"{key}={val}" for key, val in sorted_params])
        
        # Tạo secure hash
        secure_hash = hmac.new(
            self.vnp_hash_secret.encode('utf-8'),
            hash_data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        # Tạo query string (có encode)
        query_string = '&'.join([f"{key}={urllib.parse.quote_plus(str(val))}" for key, val in sorted_params])
        
        # Tạo payment URL
        payment_url = f"{self.vnp_url}?{query_string}&vnp_SecureHash={secure_hash}"
        
        return payment_url
    
    def validate_response(self, query_params: Dict[str, str]) -> Dict[str, any]:
        """
        Validate và xử lý response từ VNPay
        
        Args:
            query_params: Query parameters từ VNPay callback
        
        Returns:
            Dict chứa kết quả validation và thông tin thanh toán
        """
        # Lấy secure hash từ response
        vnp_secure_hash = query_params.get('vnp_SecureHash', '')
        
        # Remove secure hash và hash type từ params
        input_data = {k: v for k, v in query_params.items() 
                     if k not in ['vnp_SecureHash', 'vnp_SecureHashType']}
        
        # Sắp xếp params theo key (alphabet order)
        sorted_params = sorted(input_data.items())
        
        # Tạo hash data - QUAN TRỌNG: không encode giá trị, chỉ nối chuỗi
        hash_data = '&'.join([f"{key}={val}" for key, val in sorted_params])
        
        # DEBUG: Log hash calculation
        print("\n=== VNPAY VALIDATE DEBUG ===")
        print(f"Hash data: {hash_data[:200]}...")
        print(f"Secret key: {self.vnp_hash_secret[:10]}...")
        
        # Tính secure hash
        calculated_hash = hmac.new(
            self.vnp_hash_secret.encode('utf-8'),
            hash_data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        print(f"VNPay hash:     {vnp_secure_hash[:40]}...")
        print(f"Calculated hash: {calculated_hash[:40]}...")
        print(f"Match: {calculated_hash == vnp_secure_hash}")
        print("=" * 50)
        
        # Validate hash
        is_valid = calculated_hash == vnp_secure_hash
        
        # Parse response
        response_code = query_params.get('vnp_ResponseCode', '')
        transaction_status = query_params.get('vnp_TransactionStatus', '')
        
        # Kết quả
        result = {
            'is_valid': is_valid,
            'is_success': is_valid and response_code == '00',
            'order_id': query_params.get('vnp_TxnRef', ''),
            'amount': int(query_params.get('vnp_Amount', 0)) / 100,  # Chia 100 để có số tiền thực
            'response_code': response_code,
            'transaction_no': query_params.get('vnp_TransactionNo', ''),
            'bank_code': query_params.get('vnp_BankCode', ''),
            'bank_tran_no': query_params.get('vnp_BankTranNo', ''),
            'card_type': query_params.get('vnp_CardType', ''),
            'pay_date': query_params.get('vnp_PayDate', ''),
            'transaction_status': transaction_status,
            'message': self._get_response_message(response_code)
        }
        
        return result
    
    def _get_response_message(self, response_code: str) -> str:
        """Lấy message từ response code"""
        messages = {
            '00': 'Giao dịch thành công',
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
            '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
            '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
            '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
            '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
            '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
            '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
            '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
            '75': 'Ngân hàng thanh toán đang bảo trì.',
            '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
            '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
        }
        return messages.get(response_code, 'Lỗi không xác định')
