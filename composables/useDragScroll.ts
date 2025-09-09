export function useDragScroll() {
    const container = ref<HTMLElement | null>(null);
    const isDragging = ref(false);
    const startX = ref(0);
    const scrollLeft = ref(0);

    const startDragging = (e: MouseEvent) => {
        if (e.button !== 0 || !container.value) return;

        isDragging.value = true;
        startX.value = e.pageX - container.value.offsetLeft;
        scrollLeft.value = container.value.scrollLeft;

        container.value.classList.add("is-dragging");

        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", stopDragging);
    };

    const stopDragging = () => {
        isDragging.value = false;
        container.value?.classList.remove("is-dragging");

        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDragging);
    };

    const drag = (e: MouseEvent) => {
        if (!isDragging.value || !container.value) return;
        e.preventDefault();

        const x = e.pageX - container.value.offsetLeft;
        const deltaX = (x - startX.value) * 1.5;
        container.value.scrollLeft = scrollLeft.value - deltaX;
    };

    onMounted(() => {
        if (container.value) {
            container.value.style.willChange = "scroll-position";
        }
    });

    onUnmounted(() => {
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDragging);
    });

    return { container, startDragging };
}
