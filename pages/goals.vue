<template>
  <!-- Template qismi o'zgarishsiz -->
  <div class="kanban-container">
    <div
      v-for="column in columns"
      :key="column.id"
      class="kanban-column"
      @dragover.prevent="onDragOver($event, column.id)"
      @drop.prevent="onDrop($event, column.id)"
      @dragleave="onDragLeave($event)"
    >
      <h3>{{ column.title }}</h3>
      <div
        v-for="item in getItemsByColumn(column.apiStatus)"
        :key="item.id"
        class="kanban-card"
        draggable="true"
        @dragstart="onDragStart($event, item)"
        @dragend="onDragEnd"
      >
        <div class="card-header">
          <span class="patient-name">{{ item.name }}</span>
          <span class="patient-phone">{{ item.phone }}</span>
        </div>
        <div class="card-body">
          <div class="doctor-name">{{ item.doctor_name }}</div>
          <div class="booking-date">{{ formatDate(item.date) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Goal',
  data() {
    return {
      items: [],
      draggedItem: null,
      columns: [
        { id: 1, title: 'Yangilar', apiStatus: 'Kutilmoqda' },
        { id: 2, title: 'Bogʻlanib boʻlmadi', apiStatus: 'Bekor qilindi' },
        { id: 3, title: 'Aloqaga chiqdi', apiStatus: 'Aloqaga chiqdi' },
        { id: 4, title: 'Qabulga yozildi', apiStatus: 'Keldi' },
        { id: 5, title: 'Keyinroq qoʻngʻiroq', apiStatus: 'Keyinroq qoʻngʻiroq' },
      ],
      csrfToken: 'qiXtHL1ARCFCmnMSqP6HW2dKD3M8EfoNGmYRCPDccCUSOvvaRJ37rLYkWwatA1do',
    };
  },
  created() {
    this.fetchBookings();
  },
  methods: {
    async fetchBookings() {
      try {
        const response = await fetch('https://web.dad-urolog.uz/api/dashboard/bookings/');
        const data = await response.json();
        this.items = data.data;
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    },
    getItemsByColumn(apiStatus) {
      return this.items.filter(item => item.status === apiStatus);
    },
    onDragStart(event, item) {
      this.draggedItem = item;
      event.dataTransfer.setData('text/plain', item.id);
      event.target.classList.add('dragging');
    },
    onDragEnd(event) {
      event.target.classList.remove('dragging');
      document.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.remove('drag-over');
      });
    },
    onDragOver(event, columnId) {
      event.dataTransfer.dropEffect = 'move';
      event.currentTarget.classList.add('drag-over');
    },
    onDragLeave(event) {
      event.currentTarget.classList.remove('drag-over');
    },
    async onDrop(event, columnId) {
      event.currentTarget.classList.remove('drag-over');
      if (this.draggedItem) {
        const column = this.columns.find(col => col.id === columnId);
        if (column) {
          await this.updateItemStatus(this.draggedItem.id, column.apiStatus);
        }
      }
    },
    async updateItemStatus(itemId, newStatus) {
      try {
        const response = await fetch(`https://web.dad-urolog.uz/api/dashboard/bookings/${itemId}/`, {
          method: 'PATCH',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': this.csrfToken,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });
        if (response.ok) {
          // PATCH muvaffaqiyatli bo'lsa, ma'lumotlarni qayta yuklaymiz
          await this.fetchBookings();
        } else {
          const errorData = await response.json();
          console.error('Failed to update status:', errorData);
        }
      } catch (error) {
        console.error('Error updating item status:', error);
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
};
</script>

<style scoped>
/* Style qismi o'zgarishsiz */
.kanban-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow-x: auto;
}
.kanban-column {
  flex: 1;
  min-width: 280px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}
.kanban-column.drag-over {
  background: #e8f4f8;
  border: 2px dashed #007bff;
}
.kanban-column h3 {
  margin-top: 0;
  color: #343a40;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
}
.kanban-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: grab;
  transition: all 0.2s ease;
  border-left: 4px solid #007bff;
}
.kanban-card.dragging {
  opacity: 0.8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.patient-name {
  font-weight: 600;
  color: #212529;
}
.patient-phone {
  color: #6c757d;
  font-size: 14px;
}
.doctor-name {
  color: #495057;
  font-size: 14px;
  margin-bottom: 4px;
}
.booking-date {
  color: #6c757d;
  font-size: 13px;
}
</style>
