/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';
import { Button } from 'primereact/button';

const AppMenu = () => {
    const { layoutConfig, role, setRole } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Quản Lý Hệ Thống (Admin)',
            items: [
                { label: 'Quản Lý Tài Khoản', icon: 'pi pi-fw pi-users', to: '/admin/accounts' },
                { label: 'Quản Lý Danh Mục', icon: 'pi pi-fw pi-tags', to: '/admin/categories' },
                { label: 'Quản Lý Sản Phẩm', icon: 'pi pi-fw pi-shopping-bag', to: '/admin/products' },
                { label: 'Quản Lý Đơn Hàng', icon: 'pi pi-fw pi-shopping-cart', to: '/admin/orders' },
                { label: 'Quản Lý Đánh Giá', icon: 'pi pi-fw pi-star', to: '/admin/reviews' },
                { label: 'Thống Kê Báo Cáo', icon: 'pi pi-fw pi-chart-line', to: '/admin/reports' }
            ]
        }
    ];

    // filter menu model based on role - customer menu đã được chuyển lên topbar
    const filteredModel = model.filter((group) => {
        if (role === 'customer') {
            // customer should not see admin system section
            return group.label !== 'Quản Lý Hệ Thống (Admin)';
        }
        return true;
    });

    return (
        <MenuProvider>
            <div style={{ padding: '0.5rem' }} className="flex flex-column">
                <div className="mb-2">
                    <small className="text-600">Hiển thị dưới vai trò:</small>
                    <div className="mt-2 flex">
                        <Button label="Admin" className={`mr-2 ${role === 'admin' ? 'p-button-raised' : ''}`} onClick={() => setRole('admin')} />
                        <Button label="Khách" severity="secondary" className={`${role === 'customer' ? 'p-button-raised' : ''}`} onClick={() => setRole('customer')} />
                    </div>
                </div>

                <ul className="layout-menu">
                    {filteredModel.map((item, i) => {
                        return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                    })}
                </ul>
            </div>
        </MenuProvider>
    );
};

export default AppMenu;
