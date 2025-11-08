/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { useRouter } from 'next/navigation';
import { Badge } from 'primereact/badge';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar, role } = useContext(LayoutContext);
    const router = useRouter();
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme !== 'light' ? 'white' : 'dark'}.svg`} width="47.22px" height={'35px'} alt="logo" />
                <span>{role === 'admin' ? 'ADMIN THỰC PHẨM' : 'CỬA HÀNG THỰC PHẨM'}</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            {/* Menu chức năng khách hàng - hiển thị khi role là customer */}
            {role === 'customer' && (
                <div className="flex-1 flex align-items-center justify-content-center gap-3">
                    <Link href="/customer/products" className="p-link layout-topbar-button">
                        <i className="pi pi-shopping-bag"></i>
                        <span className="hidden md:inline-block ml-2">Sản Phẩm</span>
                    </Link>
                    <Link href="/customer/cart" className="p-link layout-topbar-button p-overlay-badge">
                        <i className="pi pi-shopping-cart"></i>
                        <Badge value="3" severity="danger"></Badge>
                        <span className="hidden md:inline-block ml-2">Giỏ Hàng</span>
                    </Link>
                    <Link href="/customer/orders" className="p-link layout-topbar-button">
                        <i className="pi pi-list"></i>
                        <span className="hidden md:inline-block ml-2">Đơn Hàng</span>
                    </Link>
                    <Link href="/customer/reviews" className="p-link layout-topbar-button">
                        <i className="pi pi-star"></i>
                        <span className="hidden md:inline-block ml-2">Đánh Giá</span>
                    </Link>
                </div>
            )}

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-user"></i>
                    <span>Tài khoản</span>
                </button>
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-sign-out"></i>
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
