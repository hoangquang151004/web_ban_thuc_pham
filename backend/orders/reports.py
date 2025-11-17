"""
API endpoints for reports and statistics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay, Coalesce
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
import django.db.models

from orders.models import Order, OrderItem
from products.models import Product
from users.models import User
from categories.models import Category


class ReportViewSet(viewsets.ViewSet):
    """ViewSet cho báo cáo thống kê"""
    permission_classes = [IsAuthenticated]
    
    def _check_permission(self, request):
        """Kiểm tra quyền admin hoặc seller"""
        if request.user.role not in ['admin', 'seller']:
            return False
        return True
    
    def _parse_date(self, date_str, default=None):
        """Parse date string safely"""
        if not date_str:
            return default
        try:
            # Remove timezone indicator and parse
            date_str = date_str.replace('Z', '').replace('+00:00', '')
            if 'T' in date_str:
                dt = datetime.strptime(date_str.split('.')[0], '%Y-%m-%dT%H:%M:%S')
            else:
                dt = datetime.strptime(date_str, '%Y-%m-%d')
            # Make timezone aware
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt)
            return dt
        except Exception as e:
            print(f"Error parsing date {date_str}: {e}")
            return default
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Thống kê tổng quan cho dashboard"""
        if not self._check_permission(request):
            return Response(
                {'error': 'Bạn không có quyền xem báo cáo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Lấy tham số thời gian từ request
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if start_date_str and end_date_str:
            # Sử dụng date range được cung cấp
            start_date = self._parse_date(start_date_str)
            end_date = self._parse_date(end_date_str)
            if not start_date or not end_date:
                start_date = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = timezone.now()
            
            # Tính khoảng thời gian trước đó để so sánh (cùng độ dài)
            period_length = (end_date - start_date).days
            prev_end_date = start_date - timedelta(days=1)
            prev_start_date = prev_end_date - timedelta(days=period_length)
        else:
            # Mặc định là tháng hiện tại
            start_date = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = timezone.now()
            
            # Tháng trước để so sánh
            prev_start_date = (start_date - timedelta(days=1)).replace(day=1)
            prev_end_date = start_date - timedelta(days=1)
        
        # Thống kê doanh thu khoảng thời gian hiện tại
        current_revenue = Order.objects.filter(
            status='delivered',
            payment_status='paid',
            created_at__gte=start_date,
            created_at__lte=end_date
        ).aggregate(total=Coalesce(Sum('total'), Decimal('0')))['total']
        
        # Doanh thu khoảng thời gian trước
        prev_revenue = Order.objects.filter(
            status='delivered',
            payment_status='paid',
            created_at__gte=prev_start_date,
            created_at__lte=prev_end_date
        ).aggregate(total=Coalesce(Sum('total'), Decimal('0')))['total']
        
        # Tính % thay đổi doanh thu
        revenue_change = 0
        if prev_revenue and prev_revenue > 0:
            revenue_change = float((current_revenue - prev_revenue) / prev_revenue * 100)
        
        # Số đơn hàng
        current_orders = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()
        
        prev_orders = Order.objects.filter(
            created_at__gte=prev_start_date,
            created_at__lte=prev_end_date
        ).count()
        
        orders_change = 0
        if prev_orders > 0:
            orders_change = float((current_orders - prev_orders) / prev_orders * 100)
        
        # Khách hàng mới
        current_customers = User.objects.filter(
            role='customer',
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()
        
        prev_customers = User.objects.filter(
            role='customer',
            created_at__gte=prev_start_date,
            created_at__lte=prev_end_date
        ).count()
        
        customers_change = 0
        if prev_customers > 0:
            customers_change = float((current_customers - prev_customers) / prev_customers * 100)
        
        # Tỷ lệ hoàn thành
        total_orders = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()
        
        completed_orders = Order.objects.filter(
            status='delivered',
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()
        
        completion_rate = 0
        if total_orders > 0:
            completion_rate = float(completed_orders / total_orders * 100)
        
        # Tỷ lệ hoàn thành khoảng thời gian trước
        prev_total_orders = Order.objects.filter(
            created_at__gte=prev_start_date,
            created_at__lte=prev_end_date
        ).count()
        
        prev_completed_orders = Order.objects.filter(
            status='delivered',
            created_at__gte=prev_start_date,
            created_at__lte=prev_end_date
        ).count()
        
        prev_completion_rate = 0
        if prev_total_orders > 0:
            prev_completion_rate = float(prev_completed_orders / prev_total_orders * 100)
        
        completion_rate_change = completion_rate - prev_completion_rate
        
        return Response({
            'revenue': {
                'current': float(current_revenue),
                'previous': float(prev_revenue),
                'change_percent': round(revenue_change, 1)
            },
            'orders': {
                'current': current_orders,
                'previous': prev_orders,
                'change_percent': round(orders_change, 1)
            },
            'customers': {
                'current': current_customers,
                'previous': prev_customers,
                'change_percent': round(customers_change, 1)
            },
            'completion_rate': {
                'current': round(completion_rate, 1),
                'previous': round(prev_completion_rate, 1),
                'change_percent': round(completion_rate_change, 1)
            }
        })
    
    @action(detail=False, methods=['get'])
    def revenue_by_month(self, request):
        """Doanh thu theo tháng"""
        try:
            if not self._check_permission(request):
                return Response(
                    {'error': 'Bạn không có quyền xem báo cáo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Hỗ trợ cả date range và số tháng
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')
            
            if start_date_str and end_date_str:
                # Sử dụng date range được cung cấp
                start_date = self._parse_date(start_date_str, timezone.now() - timedelta(days=180))
                end_date = self._parse_date(end_date_str, timezone.now())
            else:
                # Lấy N tháng gần nhất (mặc định 6 tháng)
                months = request.query_params.get('months', 6)
                try:
                    months = int(months)
                except:
                    months = 6
                start_date = timezone.now() - timedelta(days=30 * months)
                end_date = timezone.now()
            
            # Use raw SQL to avoid MySQL timezone issues
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        DATE_FORMAT(created_at, '%%Y-%%m-01') as month,
                        SUM(total) as total
                    FROM orders
                    WHERE status = 'delivered'
                        AND payment_status = 'paid'
                        AND created_at >= %s
                        AND created_at <= %s
                    GROUP BY DATE_FORMAT(created_at, '%%Y-%%m')
                    ORDER BY month
                """, [start_date, end_date])
                
                columns = [col[0] for col in cursor.description]
                revenue_data = [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]
            
            return Response(revenue_data)
        except Exception as e:
            print(f"Error in revenue_by_month: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def orders_by_week(self, request):
        """Số đơn hàng theo tuần"""
        try:
            if not self._check_permission(request):
                return Response(
                    {'error': 'Bạn không có quyền xem báo cáo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Hỗ trợ cả date range và số tuần
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')
            
            if start_date_str and end_date_str:
                # Sử dụng date range được cung cấp
                start_date = self._parse_date(start_date_str, timezone.now() - timedelta(weeks=4))
                end_date = self._parse_date(end_date_str, timezone.now())
            else:
                # Lấy N tuần gần nhất (mặc định 4 tuần)
                weeks = request.query_params.get('weeks', 4)
                try:
                    weeks = int(weeks)
                except:
                    weeks = 4
                start_date = timezone.now() - timedelta(weeks=weeks)
                end_date = timezone.now()
            
            # Tính số tuần trong khoảng thời gian
            delta_days = (end_date - start_date).days
            num_weeks = (delta_days // 7) + 1
            
            # Tạo danh sách tất cả các tuần trong khoảng thời gian
            from django.db import connection
            import datetime
            
            # Lấy dữ liệu đơn hàng theo tuần
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)) as week_start,
                        COUNT(id) as count
                    FROM orders
                    WHERE created_at >= %s
                        AND created_at <= %s
                    GROUP BY week_start
                    ORDER BY week_start
                """, [start_date, end_date])
                
                result = cursor.fetchall()
                orders_by_week_dict = {row[0]: row[1] for row in result}
            
            # Tạo danh sách đầy đủ các tuần (bao gồm cả tuần không có đơn hàng)
            orders_data = []
            current_date = start_date.date() if hasattr(start_date, 'date') else start_date
            
            # Điều chỉnh về thứ 2 đầu tuần
            while current_date.weekday() != 0:  # 0 = Monday
                current_date -= timedelta(days=1)
            
            week_num = 1
            while current_date <= (end_date.date() if hasattr(end_date, 'date') else end_date):
                count = orders_by_week_dict.get(current_date, 0)
                orders_data.append({
                    'week': current_date.isoformat(),
                    'week_number': week_num,
                    'count': count
                })
                current_date += timedelta(days=7)
                week_num += 1
            
            return Response(orders_data)
        except Exception as e:
            print(f"Error in orders_by_week: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def revenue_by_category(self, request):
        """Doanh thu theo danh mục"""
        if not self._check_permission(request):
            return Response(
                {'error': 'Bạn không có quyền xem báo cáo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Lấy tham số thời gian
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Parse dates with helper
        start_date = self._parse_date(start_date_str, timezone.now().replace(day=1))
        end_date = self._parse_date(end_date_str, timezone.now())
        
        category_data = OrderItem.objects.filter(
            order__status='delivered',
            order__payment_status='paid',
            order__created_at__gte=start_date,
            order__created_at__lte=end_date
        ).values(
            category_name=F('product__category__name')
        ).annotate(
            total=Sum('subtotal')
        ).order_by('-total')[:5]  # Top 5 danh mục
        
        return Response(list(category_data))
    
    @action(detail=False, methods=['get'])
    def top_products(self, request):
        """Top sản phẩm bán chạy"""
        if not self._check_permission(request):
            return Response(
                {'error': 'Bạn không có quyền xem báo cáo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Lấy tham số
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        limit = request.query_params.get('limit', 5)
        
        try:
            limit = int(limit)
        except:
            limit = 5
        
        # Parse dates with helper
        start_date = self._parse_date(start_date_str, timezone.now().replace(day=1))
        end_date = self._parse_date(end_date_str, timezone.now())
        
        top_products = OrderItem.objects.filter(
            order__status='delivered',
            order__created_at__gte=start_date,
            order__created_at__lte=end_date
        ).values(
            'product_id',
            'product__name',
            category_name=F('product__category__name')
        ).annotate(
            sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-revenue')[:limit]
        
        # Thêm rank
        result = []
        for idx, item in enumerate(top_products, 1):
            result.append({
                'rank': idx,
                'product_id': item['product_id'],
                'name': item['product__name'],
                'category': item['category_name'],
                'sold': item['sold'],
                'revenue': float(item['revenue'])
            })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def order_status_stats(self, request):
        """Thống kê theo trạng thái đơn hàng"""
        if not self._check_permission(request):
            return Response(
                {'error': 'Bạn không có quyền xem báo cáo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Lấy tham số thời gian
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Parse dates with helper
        start_date = self._parse_date(start_date_str, timezone.now().replace(day=1))
        end_date = self._parse_date(end_date_str, timezone.now())
        
        status_stats = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response(list(status_stats))
    
    @action(detail=False, methods=['get'])
    def payment_method_stats(self, request):
        """Thống kê theo phương thức thanh toán"""
        if not self._check_permission(request):
            return Response(
                {'error': 'Bạn không có quyền xem báo cáo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Lấy tham số thời gian
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Parse dates with helper
        start_date = self._parse_date(start_date_str, timezone.now().replace(day=1))
        end_date = self._parse_date(end_date_str, timezone.now())
        
        payment_stats = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).values('payment_method').annotate(
            count=Count('id'),
            total=Sum('total')
        ).order_by('-count')
        
        return Response(list(payment_stats))
    
    @action(detail=False, methods=['get'])
    def daily_revenue(self, request):
        """Doanh thu theo ngày (30 ngày gần nhất)"""
        if not self._check_permission(request):
            return Response(
                {'error': 'Bạn không có quyền xem báo cáo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except:
            days = 30
        
        start_date = timezone.now() - timedelta(days=days)
        
        daily_data = Order.objects.filter(
            status='delivered',
            payment_status='paid',
            created_at__gte=start_date
        ).annotate(
            day=TruncDay('created_at')
        ).values('day').annotate(
            revenue=Sum('total'),
            orders_count=Count('id')
        ).order_by('day')
        
        return Response(list(daily_data))
    
    @action(detail=False, methods=['get'])
    def customer_stats(self, request):
        """Thống kê khách hàng"""
        if not self._check_permission(request):
            return Response(
                {'error': 'Bạn không có quyền xem báo cáo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Tổng số khách hàng
        total_customers = User.objects.filter(role='customer').count()
        
        # Khách hàng có đơn hàng
        customers_with_orders = User.objects.filter(
            role='customer',
            orders__isnull=False
        ).distinct().count()
        
        # Top khách hàng chi tiêu nhiều nhất
        top_customers = User.objects.filter(
            role='customer'
        ).annotate(
            total_spent=Sum('orders__total', filter=Q(orders__status='delivered')),
            total_orders=Count('orders', filter=Q(orders__status='delivered'))
        ).filter(
            total_spent__isnull=False
        ).order_by('-total_spent')[:10]
        
        top_customers_data = [
            {
                'id': customer.id,
                'name': customer.full_name,
                'email': customer.email,
                'phone': customer.phone,
                'total_spent': float(customer.total_spent or 0),
                'total_orders': customer.total_orders
            }
            for customer in top_customers
        ]
        
        return Response({
            'total_customers': total_customers,
            'customers_with_orders': customers_with_orders,
            'top_customers': top_customers_data
        })
