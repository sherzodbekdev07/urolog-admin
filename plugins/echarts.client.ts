import { defineNuxtPlugin } from '#app'
import VueECharts from 'vue-echarts'
import { use } from 'echarts/core'

// kerakli modullarni ulash
import {
    CanvasRenderer
} from 'echarts/renderers'
import {
    PieChart,
    LineChart,
    BarChart
} from 'echarts/charts'
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
} from 'echarts/components'

use([
    CanvasRenderer,
    PieChart,
    LineChart,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
])

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('v-chart', VueECharts)
})
