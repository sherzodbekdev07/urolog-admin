export function useAutoScroll(containerRef: any) {
    const isDragging = ref(false);
    const scrollSpeed = 15;
    const scrollArea = 100;

    const onDragOver = (e: DragEvent) => {
        if (!containerRef.value || !isDragging.value) return;

        const container = containerRef.value;
        const { left, right } = container.getBoundingClientRect();
        const mouseX = e.clientX;

        if (mouseX - left < scrollArea) {
            container.scrollLeft -= scrollSpeed;
        } else if (right - mouseX < scrollArea) {
            container.scrollLeft += scrollSpeed;
        }
    };

    const start = () => {
        isDragging.value = true;
        window.addEventListener("dragover", onDragOver);
    };

    const stop = () => {
        isDragging.value = false;
        window.removeEventListener("dragover", onDragOver);
    };

    onBeforeUnmount(() => {
        stop();
    });

    return {
        startAutoScroll: start,
        stopAutoScroll: stop,
    };
}
