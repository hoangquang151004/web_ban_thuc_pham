"""
MoMo Payment Integration
Documentation: https://developers.momo.vn/
"""
import hashlib
import hmac
import json
import requests
from typing import Dict, Optional
import uuid


class MoMo:
    """MoMo Payment Gateway Handler"""
    
    def __init__(
        self,
        partner_code: str,
        access_key: str,
        secret_key: str,
        api_url: str,
        return_url: str,
        notify_url: str = None
    ):
        """
        Initialize MoMo configuration
        
        Args:
            partner_code: MoMo Partner Code
            access_key: MoMo Access Key
            secret_key: MoMo Secret Key
            api_url: MoMo API URL
            return_url: Return URL after payment
            notify_url: IPN/Notify URL for webhook (optional)
        """
        self.partner_code = partner_code
        self.access_key = access_key
        self.secret_key = secret_key
        self.api_url = api_url
        self.return_url = return_url
        self.notify_url = notify_url or return_url
    
    def create_payment_url(
        self,
        order_id: str,
        amount: float,
        order_info: str,
        redirect_url: Optional[str] = None,
        ipn_url: Optional[str] = None,
        extra_data: str = '',
        auto_capture: bool = True,
        lang: str = 'vi'
    ) -> Dict[str, any]:
        """
        Tạo payment request tới MoMo
        
        Args:
            order_id: Mã đơn hàng (unique)
            amount: Số tiền (VNĐ) - phải là số nguyên
            order_info: Mô tả đơn hàng
            redirect_url: URL redirect sau thanh toán (override return_url)
            ipn_url: URL nhận IPN callback (override notify_url)
            extra_data: Dữ liệu bổ sung (optional)
            auto_capture: Tự động capture payment (default: True)
            lang: Ngôn ngữ (vi/en)
        
        Returns:
            Dict chứa payment_url và request_id nếu thành công
        """
        # Generate request ID
        request_id = str(uuid.uuid4())
        
        # Request data
        request_data = {
            'partnerCode': self.partner_code,
            'partnerName': 'MoMo Payment',
            'storeId': self.partner_code,
            'requestId': request_id,
            'amount': int(amount),  # MoMo yêu cầu amount là số nguyên
            'orderId': order_id,
            'orderInfo': order_info,
            'redirectUrl': redirect_url or self.return_url,
            'ipnUrl': ipn_url or self.notify_url,
            'lang': lang,
            'extraData': extra_data,
            'requestType': 'captureWallet' if auto_capture else 'payWithATM',
            'autoCapture': auto_capture
        }
        
        # Tạo raw signature theo thứ tự alphabet
        raw_signature = (
            f"accessKey={self.access_key}"
            f"&amount={request_data['amount']}"
            f"&extraData={request_data['extraData']}"
            f"&ipnUrl={request_data['ipnUrl']}"
            f"&orderId={request_data['orderId']}"
            f"&orderInfo={request_data['orderInfo']}"
            f"&partnerCode={request_data['partnerCode']}"
            f"&redirectUrl={request_data['redirectUrl']}"
            f"&requestId={request_data['requestId']}"
            f"&requestType={request_data['requestType']}"
        )
        
        # Tạo signature bằng HMAC SHA256
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        request_data['signature'] = signature
        
        # Debug log
        print("\n=== MOMO CREATE PAYMENT DEBUG ===")
        print(f"Request ID: {request_id}")
        print(f"Order ID: {order_id}")
        print(f"Amount: {request_data['amount']}")
        print(f"Raw signature: {raw_signature[:100]}...")
        print(f"Signature: {signature}")
        print("=" * 50)
        
        try:
            # Gửi request tới MoMo
            response = requests.post(
                self.api_url,
                json=request_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            result = response.json()
            
            print(f"MoMo Response: {result}")
            print("=" * 50)
            
            if result.get('resultCode') == 0:
                return {
                    'success': True,
                    'payment_url': result.get('payUrl'),
                    'request_id': request_id,
                    'deep_link': result.get('deeplink'),
                    'qr_code_url': result.get('qrCodeUrl')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Unknown error'),
                    'result_code': result.get('resultCode')
                }
                
        except requests.exceptions.RequestException as e:
            print(f"Error calling MoMo API: {str(e)}")
            return {
                'success': False,
                'error': f'Network error: {str(e)}'
            }
        except Exception as e:
            print(f"Error creating MoMo payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def validate_response(self, data: Dict[str, str]) -> Dict[str, any]:
        """
        Validate và xử lý response/IPN từ MoMo
        
        Args:
            data: Data từ MoMo callback (query params hoặc POST body)
        
        Returns:
            Dict chứa kết quả validation và thông tin thanh toán
        """
        # Lấy signature từ response
        received_signature = data.get('signature', '')
        
        # Tạo raw signature để validate
        # Thứ tự các field phải giống với document của MoMo
        raw_signature = (
            f"accessKey={self.access_key}"
            f"&amount={data.get('amount', '')}"
            f"&extraData={data.get('extraData', '')}"
            f"&message={data.get('message', '')}"
            f"&orderId={data.get('orderId', '')}"
            f"&orderInfo={data.get('orderInfo', '')}"
            f"&orderType={data.get('orderType', '')}"
            f"&partnerCode={data.get('partnerCode', '')}"
            f"&payType={data.get('payType', '')}"
            f"&requestId={data.get('requestId', '')}"
            f"&responseTime={data.get('responseTime', '')}"
            f"&resultCode={data.get('resultCode', '')}"
            f"&transId={data.get('transId', '')}"
        )
        
        # Tính signature
        calculated_signature = hmac.new(
            self.secret_key.encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Debug log
        print("\n=== MOMO VALIDATE RESPONSE DEBUG ===")
        print(f"Raw signature: {raw_signature[:100]}...")
        print(f"Received signature:   {received_signature[:40]}...")
        print(f"Calculated signature: {calculated_signature[:40]}...")
        print(f"Match: {calculated_signature == received_signature}")
        print("=" * 50)
        
        # Validate signature
        is_valid = calculated_signature == received_signature
        
        # Parse result
        result_code = int(data.get('resultCode', -1))
        
        result = {
            'is_valid': is_valid,
            'is_success': is_valid and result_code == 0,
            'order_id': data.get('orderId', ''),
            'amount': int(data.get('amount', 0)),
            'result_code': result_code,
            'message': data.get('message', ''),
            'trans_id': data.get('transId', ''),
            'request_id': data.get('requestId', ''),
            'pay_type': data.get('payType', ''),
            'response_time': data.get('responseTime', ''),
            'extra_data': data.get('extraData', ''),
            'order_info': data.get('orderInfo', ''),
            'error_message': self._get_error_message(result_code)
        }
        
        return result
    
    def _get_error_message(self, result_code: int) -> str:
        """Lấy message từ result code"""
        messages = {
            0: 'Giao dịch thành công',
            9000: 'Giao dịch được khởi tạo, chờ người dùng xác nhận thanh toán',
            8000: 'Giao dịch đang được xử lý',
            7000: 'Giao dịch đang chờ thanh toán',
            1000: 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán',
            11: 'Truy cập bị từ chối',
            12: 'Phiên bản API không được hỗ trợ cho yêu cầu này',
            13: 'Xác thực dữ liệu thất bại (Checksum failed)',
            20: 'Số tiền không hợp lệ',
            21: 'Số tiền giao dịch không hợp lệ',
            40: 'RequestId bị trùng',
            41: 'OrderId bị trùng',
            42: 'OrderId không hợp lệ hoặc không tìm thấy',
            43: 'Yêu cầu bị từ chối vì xung đột trong quá trình xử lý giao dịch',
            1001: 'Giao dịch thanh toán thất bại do tài khoản người dùng không đủ tiền',
            1002: 'Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán',
            1003: 'Giao dịch bị hủy',
            1004: 'Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức thanh toán của người dùng',
            1005: 'Giao dịch thất bại do url hoặc QR code đã hết hạn',
            1006: 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán',
            1007: 'Giao dịch bị từ chối vì người dùng đã hủy giao dịch',
            1026: 'Giao dịch bị hạn chế theo thể lệ chương trình khuyến mãi',
            1080: 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu không được tìm thấy',
            1081: 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu đã được hoàn',
            2001: 'Giao dịch thất bại do sai thông tin liên kết',
            2007: 'Giao dịch thất bại do sai hoặc hết hạn OTP',
            3001: 'Liên kết thất bại do người dùng từ chối xác nhận thanh toán',
            3002: 'Liên kết bị từ chối do không thỏa điều kiện',
            3003: 'Tài khoản đã bị liên kết với tài khoản khác',
            3004: 'Liên kết thất bại do sai OTP',
            4001: 'Giao dịch bị hạn chế do người dùng chưa hoàn tất xác thực tài khoản',
            4010: 'Người dùng chưa được kích hoạt ví MoMo',
            4011: 'Tài khoản của người dùng bị khóa',
            4100: 'Giao dịch thất bại do người dùng không phải là chủ tài khoản ví MoMo',
            10: 'Hệ thống đang bảo trì',
            99: 'Lỗi không xác định'
        }
        return messages.get(result_code, f'Lỗi không xác định (Mã lỗi: {result_code})')
    
    def query_transaction_status(self, order_id: str, request_id: str) -> Dict[str, any]:
        """
        Truy vấn trạng thái giao dịch từ MoMo
        
        Args:
            order_id: Mã đơn hàng
            request_id: Request ID khi tạo payment
        
        Returns:
            Dict chứa thông tin trạng thái giao dịch
        """
        # Generate new request ID for query
        query_request_id = str(uuid.uuid4())
        
        # Request data
        request_data = {
            'partnerCode': self.partner_code,
            'requestId': query_request_id,
            'orderId': order_id,
            'lang': 'vi'
        }
        
        # Tạo signature
        raw_signature = (
            f"accessKey={self.access_key}"
            f"&orderId={order_id}"
            f"&partnerCode={self.partner_code}"
            f"&requestId={query_request_id}"
        )
        
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        request_data['signature'] = signature
        
        try:
            # Gọi API query (endpoint khác với create payment)
            query_url = self.api_url.replace('/create', '/query')
            response = requests.post(
                query_url,
                json=request_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            result = response.json()
            return result
            
        except Exception as e:
            print(f"Error querying transaction: {str(e)}")
            return {
                'resultCode': -1,
                'message': str(e)
            }
