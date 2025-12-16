/* eslint-disable @next/next/no-img-element */

import React, { useContext, useState, useEffect } from "react";
import AppMenuitem from "./AppMenuitem";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import { AppMenuItem } from "@/types";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import classNames from "classnames";
import "primeicons/primeicons.css";

const AppMenu = () => {
  const { layoutConfig, layoutState, setLayoutState } =
    useContext(LayoutContext);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const model: AppMenuItem[] = [
    {
      label: "Telas",
      items: [
        {
          label: "Nível Estático, Precipitação e Vazão",
          to: "/",
          icon: "pi pi-fw pi-chart-line",
        },
        {
          label: "Qualiadade da Água",
          to: "pages/qualidade-agua",
          icon: "pi pi-fw pi-chart-line",
        },
      ],
    },
  ];


  const toggleSidebar = () => {
    setVisible(!visible);
  };

  // Configurações do Sidebar
  const sidebarProps = isMobile
    ? {
      modal: true,
      dismissable: true,
      showCloseIcon: true,
      blockScroll: true,
      style: { width: "85%" },
    }
    : {
      modal: false,
      dismissable: false,
      showCloseIcon: false,
      blockScroll: false,
      style: { width: "16rem" },
    };

  return (
    <>
      {!visible && (
        <Button
          icon="pi pi-bars"
          className="p-button-rounded p-button-primary sidebar-toggle-btn"
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "1rem",
            zIndex: 1000,
            width: "3.5rem",
            height: "3.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.3s ease",
          }}
        />
      )}

      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        className={classNames("app-sidebar", { "mobile-sidebar": isMobile })}
        {...sidebarProps}
      >
        <div className="sidebar-header">
          <div className="flex align-items-center gap-2">
            <h2 className="m-0 text-900">Menu</h2>
          </div>

          {isMobile && (
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-text p-button-plain"
              onClick={() => setVisible(false)}
            />
          )}
        </div>

        <MenuProvider>
          <ul className="layout-menu list-none p-0 m-0">
            {model.map((item, i) => {
              return !item?.seperator ? (
                <AppMenuitem
                  item={item}
                  root={true}
                  index={i}
                  key={item.label}
                />
              ) : (
                <li className="menu-separator" key={`separator-${i}`}></li>
              );
            })}
          </ul>
        </MenuProvider>

        <div className="sidebar-footer">
          <Button
            label="Fechar Menu"
            icon="pi pi-chevron-left"
            className="p-button-outlined p-button-secondary"
            onClick={() => setVisible(false)}
            style={{ width: "100%" }}
          />
        </div>
      </Sidebar>

      <style jsx>{`
        /* Estilos para o sidebar */
        :global(.app-sidebar) {
          padding: 1rem;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          background: var(--surface-card);
          border-right: 1px solid var(--surface-border);
          display: flex;
          flex-direction: column;
        }

        :global(.app-sidebar .p-sidebar-content) {
          padding: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        :global(.app-sidebar .sidebar-header) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--surface-border);
          flex-shrink: 0;
        }

        :global(.app-sidebar .layout-menu) {
          flex: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        :global(.app-sidebar .sidebar-footer) {
          padding-top: 1rem;
          border-top: 1px solid var(--surface-border);
          flex-shrink: 0;
        }

        :global(.mobile-sidebar) {
          width: 85% !important;
        }

        /* Botão flutuante no final */
        :global(.sidebar-toggle-btn) {
          transition: all 0.3s ease;
        }

        :global(.sidebar-toggle-btn:hover) {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3) !important;
        }

        /* Animação para o botão de toggle */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default AppMenu;
