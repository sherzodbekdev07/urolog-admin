<template>
  <div class="flex justify-center">
    <div
      ref="container"
      class="min-h-[400px] transition-all duration-300 ease-linear w-full flex overflow-x-auto p-4"
    >
      <!-- Ustunlar -->
      <div
        v-for="(column, i) in columns"
        :key="column.title"
        :data-column-index="i"
        class="border bg-gray-50 flex flex-col border-gray-200 shadow-sm dark:border-[#48484a] dark:bg-[#2c2c2e] rounded-xl px-3 py-3 column-width mr-4 last:mr-0"
      >
        <!-- Ustun nomi -->
        <p
          class="text-gray-700 dark:text-neutral-300 font-semibold font-sans tracking-wide text-sm text-center"
        >
          {{ column.title }}
        </p>

        <!-- Drag and Drop -->
        <draggable
          @change="draggTask"
          @start="startAutoScroll"
          @end="draggTaskEnd($event), stopAutoScroll()"
          :value="column.tasks"
          :animation="150"
          group="tasks"
          :data-column-index="i"
          class="grow pb-3 dragArea list-group"
        >
          <template #item="{ element }">
            <!-- TaskCard O'zida -->
            <div
              class="bg-white dark:bg-[#1e1e1e] shadow-md rounded-lg p-3 border dark:border-[#48484a] transition-all hover:shadow-lg mt-3 cursor-move"
            >
              <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200">
                {{ element.name }}
              </h3>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                📞 {{ element.phone }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ element.text || "No description" }}
              </p>
              <p class="text-[10px] text-gray-400 mt-2">
                Last change:
                {{ new Date(element.last_status_changed).toLocaleString() }}
              </p>
            </div>
          </template>

          <!-- Agar ustun bo'sh bo'lsa -->
          <template #footer>
            <div
              v-if="!column.tasks.length"
              class="text-center transition-all w-full grow order-5 border-2 rounded flex items-center justify-center text-gray-500 text-sm italic mt-3 dark:border-[#48484a]"
            >
              No tasks available
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { ref, computed } from "vue";
import { useDragScroll } from "@/composables/useDragScroll";
import { useAutoScroll } from "@/composables/useAutoScroll";

/* Mock API ma'lumotlari */
const tasks = ref([
  {
    id: 48,
    name: "Аоари",
    phone: "+998901234567",
    text: "Варик",
    status: "not_reached_1",
    last_status_changed: "2025-09-08T16:43:58.044910+05:00",
  },
  {
    id: 47,
    name: "Нурмухаммад",
    phone: "+998915177817",
    text: "Катталаштирмокчи",
    status: "new",
    last_status_changed: "2025-09-08T17:26:11.369253+05:00",
  },
  {
    id: 46,
    name: "Bobur",
    phone: "+998911234567",
    text: "kattalashtirish uchun",
    status: "contacted",
    last_status_changed: "2025-09-08T21:11:16.658183+05:00",
  },
  {
    id: 45,
    name: "test",
    phone: "+998911234567",
    text: "test",
    status: "new",
    last_status_changed: "2025-09-08T21:11:12.700346+05:00",
  },
  {
    id: 44,
    name: "Bobur Gulomov",
    phone: "+998911234567",
    text: "",
    status: "appt_set",
    last_status_changed: "2025-09-08T16:45:03.682768+05:00",
  },
  {
    id: 40,
    name: "yana boshqa kontakt",
    phone: "998911234567",
    text: "warfaewrfawe",
    status: "call_later",
    last_status_changed: "2025-09-08T16:29:01.013027+05:00",
  },
]);

/* Statuslar bo'yicha ustunlar */
const columns = ref([
  { title: "new", tasks: tasks.value.filter(t => t.status === "new") },
  { title: "contacted", tasks: tasks.value.filter(t => t.status === "contacted") },
  { title: "call_later", tasks: tasks.value.filter(t => t.status === "call_later") },
  { title: "not_reached_1", tasks: tasks.value.filter(t => t.status === "not_reached_1") },
  { title: "appt_set", tasks: tasks.value.filter(t => t.status === "appt_set") },
]);

/* Scroll composables */
const { container, startDragging } = useDragScroll();
const { startAutoScroll, stopAutoScroll } = useAutoScroll(container);

/* Dragging uchun vaqtinchalik qiymatlar */
let taskId = ref<null | number>(null);
let orderId = ref<null | number>(null);

/* Drag tugagandan keyingi logika */
function draggTaskEnd(evt: any) {
  if (evt.to) {
    const destinationIndex = evt.to.getAttribute("data-column-index");
    if (destinationIndex !== null) {
      const destinationColumn = columns.value[destinationIndex];
      console.log("Task moved to column:", destinationColumn.title);
      console.log("Task id:", taskId.value);

      let body: { status?: string; order?: number } = {};
      if (destinationColumn.title) {
        body.status = destinationColumn.title;
      }
      if (orderId.value !== null) {
        body.order = orderId.value;
      }
      console.log("Updated data for API:", body);
    }
  }
}

/* Drag jarayonidagi qiymatlarni olish */
function draggTask(evt: any) {
  if (evt?.added?.element?.id) {
    taskId.value = evt.added.element.id;
    orderId.value = evt.added.newIndex + 1;
  }
  if (evt?.moved?.element?.id) {
    taskId.value = evt.moved.element.id;
    orderId.value = evt.moved.newIndex + 1;
  }
}
</script>

<style scoped>
.column-width {
  width: 100%;
  min-width: 310px;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.dragArea {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dragArea .list-group {
  flex-grow: 1;
}

.ghost-card {
  opacity: 0.5;
  background: #f7fafc;
  border: 1px solid #4299e1;
}

.dragArea .list-group > div {
  flex-shrink: 0;
}

.text-center {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
