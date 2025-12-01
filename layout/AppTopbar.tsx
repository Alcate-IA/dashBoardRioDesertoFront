/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    return (
        <div className="layout-topbar" style={{ justifyContent: 'flex-start' }}>
            <Link href="/" className="layout-topbar-logo" style={{ width: 'auto', display: 'flex', alignItems: 'center' }}>
                <img src="/layout/images/logo-rio-deserto.png" alt="Rio Deserto Logo" width="210" height="60" style={{ objectFit: 'contain' }} />
            </Link>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
