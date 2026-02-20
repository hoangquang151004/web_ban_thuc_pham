import { NextResponse } from 'next/server';

// Simple mock chatbot endpoint. Replace with backend integration later.
export async function POST(req: Request) {
    const { message } = await req.json();
    const lower = (message || '').toLowerCase();

    let reply = 'Cảm ơn bạn! Mình đang ghi nhận yêu cầu.';
    if (lower.includes('sữa') || lower.includes('milk')) {
        reply = 'Các sản phẩm sữa tươi hữu cơ đang giảm 10% hôm nay.';
    } else if (lower.includes('trái cây') || lower.includes('fruit')) {
        reply = 'Có táo, chuối, dâu tây tươi mới nhập sáng nay.';
    } else if (lower.includes('giá') || lower.includes('price')) {
        reply = 'Bạn có thể lọc theo khoảng giá trong danh mục sản phẩm.';
    } else if (lower.includes('khuyến mãi') || lower.includes('sale')) {
        reply = 'Hiện có chương trình khuyến mãi cho đơn trên 500k.';
    } else if (lower.includes('xin chào') || lower.includes('hello')) {
        reply = 'Xin chào! Mình có thể giúp gì cho bạn hôm nay?';
    } else if (lower.includes('tạm biệt') || lower.includes('bye')) {
        reply = 'Chào bạn! Hẹn gặp lại lần sau nhé!';
    } else if (lower.includes('giúp đỡ') || lower.includes('help')) {
        reply = 'Mình có thể giúp bạn tìm sản phẩm, thông tin khuyến mãi, và hỗ trợ mua hàng.';
    } else if (lower.includes('đặt hàng') || lower.includes('order')) {
        reply = 'Bạn có thể thêm sản phẩm vào giỏ hàng và tiến hành thanh toán ở trang giỏ hàng.';
    } else if (lower.includes('giao hàng') || lower.includes('delivery')) {
        reply = 'Chúng tôi hỗ trợ giao hàng tận nơi trong vòng 2-3 ngày làm việc.';
    } else if (lower.includes('phương thức thanh toán') || lower.includes('payment methods')) {
        reply = 'Chúng tôi chấp nhận thanh toán qua chuyển khoản ngân hàng và ví điện tử. Hoặc thanh toán khi nhận hàng.';
    } else if (lower.includes('quang') || lower.includes('admin')) {
        reply = 'Quang đẹp trai là admin của web này nhé!';
    } else if (lower.includes('duy') || lower.includes('Chủ tích')) {
        reply = 'Duy đẹp trai là chủ tịch. Là nhân viên bảo vệ giả giàu. ĐỪNG BAO GIỜ COI THƯỜNG CHỦ TỊCH!';
    }

    return NextResponse.json({ reply });
}
