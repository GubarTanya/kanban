Vue.component('add-task', {
    template: `
    <div>
        <p v-if="errors.length">
            <b>Пожалуйста исправьте следующие ошибки:</b>
            <ul>
                <li v-for="error in errors">{{ error }}</li>
            </ul>
        </p>
        <h2>Создать задачу</h2>
        <div>
            <label>Название: <br>
                <input placeholder="Новая задача" v-model="task.title">
            </label>
            <h3>Задачи</h3>
            <div v-for="(subtask, index) in task.subtasks">
                <textarea placeholder="Описание" v-model="subtask.title" :key="index"></textarea>
            </div>
            <div>
                <input type="radio" id="yes" name="drone" v-model="task.importance" value="1"/>
                <label for="yes">Важный</label>
            </div>

            <div>
                <input type="radio" id="no" name="drone" v-model="task.importance" value="0" />
                <label for="no">Простой</label>
            </div>
            <input type="date" v-model="task.deadline_date">
            <button class="create" @click="addTask">Создать</button>
        </div>
    </div>
    `,
    methods: {
        addTask() {
            this.errors = [];
            if (!this.task.title || this.task.subtasks.filter(subtask => subtask.title).length === 0 || !this.task.deadline_date) {
                if (!this.task.title) this.errors.push("Требуется название.");
                if (this.task.subtasks.filter(subtask => subtask.title).length === 0) this.errors.push("У вас должно быть описание.");
                if (!this.task.deadline_date) this.errors.push("Требуемый срок.");
                return;
            }
            let productReview = {
                title: this.task.title,
                subtasks: this.task.subtasks.filter(subtask => subtask.title),
                date: this.task.date,
                time: this.task.time,
                importance: this.task.importance,
                deadline_date: this.task.deadline_date
            };
            this.$emit('add-task', productReview);
            location.reload()
        },
    },
    data() {
        return {
            errors: [],
            task: {
                title: 'Новая задача',
                subtasks: [
                    {title: ""},
                ],
                importance: 1,
                deadline_date: '',
                time: new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds(),
                date: new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' + new Date().getDate(),
            }
        }
    },
})

let app = new Vue({
    el: '#app',
    data: {
        columns: [
            {
                index: 0,
                title: "Планируемые задачи",
                tasks: [],
            },
            {
                index: 1,
                title: "Активные",
                tasks: []
            },
            {
                index: 2,
                title: "Тестирование",
                tasks: [],
            },
            {
                index: 3,
                title: "Выполненные",
                tasks: [],
                expired: false
            },
        ]
    },
    mounted() {
        if (!localStorage.getItem('columns')) return
        this.columns = JSON.parse(localStorage.getItem('columns'));

        this.columns.forEach(column => {
            column.tasks.forEach(task => {
                const isEditing = localStorage.getItem('task_' + task.title + '_isEditing');
                if (isEditing !== null) {
                    task.isEditing = JSON.parse(isEditing);
                }
            });
        });
    },
    methods: {
        returnToActive(task,column) {
            const reason = prompt("Укажите причину возврата задания:");
            if (reason) {
                if (!task.returnReason) {
                    this.$set(task, 'returnReason', []);
                }
                task.returnReason.push(reason);
                this.$emit('move-task2', { task: task, column: column });
            }
        },
        dropTask({ taskData, column }) {
            const currentColumn = this.columns.find(col => col === column);
            const currentIndex = this.columns.findIndex(col => col === column);
                if (currentIndex > 0) {
                    const previousColumn = this.columns[currentIndex - 1];
                    let taskIndex = -1;

                    for (let i = 0; i < previousColumn.tasks.length; i++) {
                        if (previousColumn.tasks[i].title === taskData.title) {
                            taskIndex = i;
                            break;
                        }
                    }

                    if (taskIndex !== -1) {
                        previousColumn.tasks.splice(taskIndex, 1);
                        currentColumn.tasks.push(taskData);
                        this.save();
                    } else {
                            const nextColumn = this.columns[currentIndex + 1];
                            taskIndex = nextColumn.tasks.findIndex(task => task.title === taskData.title);
                            if (currentIndex !== 2) {
                                if (taskIndex !== -1) {
                                    nextColumn.tasks.splice(taskIndex, 1);
                                    currentColumn.tasks.push(taskData);
                                    this.returnToActive(taskData);
                                    this.save();
                                }
                            }
                    }
                }
        },
        save() {
            localStorage.setItem('columns', JSON.stringify(this.columns))
        },
        addTask(task) {
            if ((this.columns[0].tasks.length > 2) || this.columns[0].disabled) return
            this.columns[0].tasks.push(task)
        },
        delTask(task){
            this.columns[0].tasks.splice(task,1)
        },
        move(data) {
            if (data.column.index === 2 && new Date(data.task.task.date) > new Date(data.task.task.deadline_date)) {
                data.task.column.expired = true;
            }
            data.task.task.time = new Date().getHours() + ':' + new Date().getMinutes() + ':' +new Date().getSeconds()
            data.task.task.date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
            const fromColumn = this.columns[data.column.index];
            const toColumn = this.columns[data.column.index + 1];
            if (toColumn) {
                toColumn.tasks.push(fromColumn.tasks.splice(fromColumn.tasks.indexOf(data.task), 1)[0]);
                this.save();
            }
        },
        move2(data) {
            data.task.task.time = new Date().getHours() + ':' + new Date().getMinutes() + ':' +new Date().getSeconds()
            data.task.task.date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
            const fromColumn = this.columns[data.column.index];
            const toColumn = this.columns[data.column.index - 1];
            if (toColumn) {
                toColumn.tasks.push(fromColumn.tasks.splice(fromColumn.tasks.indexOf(data.task), 1)[0]);
                this.save();
            }
        },
    },
})