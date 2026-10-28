"use client";

import { useEffect, useRef, RefObject } from "react";

export interface UseModalFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Ref opcional para enfocar un elemento específico al abrir.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Si es true (por ejemplo en confirmaciones destructivas),
   * prioriza enfocar un botón seguro (Cancelar o Cerrar) para evitar
   * pulsaciones accidentales de Enter.
   */
  isDestructive?: boolean;
  /**
   * Si la tecla Escape debe cerrar el diálogo (por defecto true).
   */
  closeOnEscape?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(", ");

const EDITABLE_INPUT_SELECTOR = [
  'input:not([type="hidden"]):not([disabled]):not([readonly])',
  'select:not([disabled])',
  'textarea:not([disabled]):not([readonly])',
].join(", ");

/**
 * Hook reutilizable para accesibilidad completa en ventanas modales y emergentes:
 * 1. Atrapamiento del foco (Focus Trap con Tab y Shift + Tab).
 * 2. Bloqueo de la pantalla de fondo con `inert` y scroll lock.
 * 3. Enfoque inicial inteligente (primer input en formularios, cancelar en destructivos).
 * 4. Restauración del foco al elemento que abrió el modal al cerrarse.
 * 5. Cierre mediante la tecla Escape.
 */
export function useModalFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  initialFocusRef,
  isDestructive = false,
  closeOnEscape = true,
}: UseModalFocusTrapOptions) {
  const modalRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    // 1. Guardar el elemento previamente activo para restaurar el foco al cerrar
    previousActiveElement.current = document.activeElement as HTMLElement;

    // 2. Bloquear scroll del fondo
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 3. Aplicar 'inert' a todos los hermanos de los ancestros del modal (pantalla de fondo)
    // Se recorre desde el modal hasta body, marcando los nodos hermanos sin afectar al modal
    // ni a ninguno de sus ancestros directos.
    const inertElements: HTMLElement[] = [];
    const modalEl: HTMLElement | null = modalRef.current;

    if (modalEl) {
      let current: HTMLElement | null = modalEl;
      while (current && current !== document.body && current.parentElement) {
        const parentEl: HTMLElement = current.parentElement;
        Array.from(parentEl.children).forEach((child) => {
          if (child !== current && child instanceof HTMLElement) {
            // No marcar nodos del modal portal o toasts si existieran
            if (!child.hasAttribute("inert")) {
              child.setAttribute("inert", "");
              inertElements.push(child);
            }
          }
        });
        current = parentEl;
      }
    }

    // 4. Mover el foco inicial al elemento apropiado
    const focusTimer = setTimeout(() => {
      if (!modalRef.current) return;

      // Opción A: Ref explícito proporcionado
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        if (
          initialFocusRef.current instanceof HTMLInputElement &&
          initialFocusRef.current.type === "text"
        ) {
          initialFocusRef.current.select();
        }
        return;
      }

      // Opción B: Acción destructiva -> enfocar Cancelar o Cerrar
      if (isDestructive) {
        const safeButton = modalRef.current.querySelector<HTMLElement>(
          'button[data-cancel="true"], button:not([type="submit"]):not([disabled])'
        );
        if (safeButton) {
          safeButton.focus();
          return;
        }
      }

      // Opción C: Formulario -> enfocar el primer campo editable
      const firstInput = modalRef.current.querySelector<HTMLElement>(EDITABLE_INPUT_SELECTOR);
      if (firstInput) {
        firstInput.focus();
        if (firstInput instanceof HTMLInputElement && firstInput.type === "text") {
          firstInput.select();
        }
        return;
      }

      // Opción D: Primer elemento interactivo disponible
      const firstFocusable = modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        modalRef.current.focus();
      }
    }, 50);

    // 5. Atrapamiento del foco con Tab y Shift + Tab
    function handleKeyDown(e: KeyboardEvent) {
      if (!modalRef.current) return;

      if (closeOnEscape && e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(
          (el) =>
            el.offsetParent !== null ||
            el.getClientRects().length > 0 ||
            window.getComputedStyle(el).display !== "none"
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    // 6. Salvaguarda adicional: evitar que el foco salga del modal mediante focusin
    function handleFocusIn(e: FocusEvent) {
      if (!modalRef.current) return;
      if (e.target && !modalRef.current.contains(e.target as Node)) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        firstFocusable?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    // 7. Cleanup y restauración de foco y estado del DOM
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.body.style.overflow = originalOverflow;

      // Remover 'inert' de los elementos de fondo
      inertElements.forEach((el) => {
        el.removeAttribute("inert");
      });

      // Restaurar el foco al elemento que abrió la ventana
      if (previousActiveElement.current && document.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, isDestructive, closeOnEscape, initialFocusRef]);

  return { modalRef };
}
