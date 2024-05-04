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

Vue.component('column', {
    props: {
        column: {
            title: '',
            tasks: [],
            date: '',
            deadline_date: '',
        }
    },
    template: `
        <div class="column" @dragover.prevent @drop="dropTask">
    <div class="column">
        <h2>{{column.title}}</h2>
        <div class="task">
        <task v-for="(task, index) in sortedTasks"
        :key="index"
        :task="task"
        @del-task="delTask"
        @move-task="move"
        @movee-task="movee"
        @drop-task="dropTask"
        @update-task="updateTask">
        
    </task>
        </div>
    </div>
    </div>
    `,
    updated() {
        this.$emit('save')
    },
    methods: {
        dropTask(event) {
            const taskData = JSON.parse(event.dataTransfer.getData('task'));
            this.$emit('drop-task', { taskData, column: this.column });
        },
        move(task) {
            this.$emit('move-task', { task, column: this.column });
        },
        movee(task) {
            this.$emit('movee-task', { task, column: this.column });
        },
        delTask(task){
            this.$emit('del-task', task);
        },
        updateTask(task) {
            this.$emit('save');
        },
    },
    computed: {
        sortedTasks() {
            return this.column.tasks.sort((a, b) => b.importance - a.importance);
        },
    }
})

Vue.component('task', {
    props: {
        task: {
            title: '',
            subtasks: [],
            importance: '',
            returnReason: []
        }
    },
    template: `
        <div :class="{task2: isFirstColumn}" id="coll" draggable="true" @start="start">
        <h2 v-if="!task.isEditing">{{ task.title }}</h2>
        <input v-if="task.isEditing" v-model="task.title" placeholder="Task title" />
        <p v-for="(subtask, index) in task.subtasks" class="subtask" :key="index">
            <span v-if="!task.isEditing">{{ subtask.title }}</span>
            <textarea v-if="task.isEditing" v-model="subtask.title" placeholder="Subtask description"></textarea>
        </p>
        <p>Дата изменения: {{ task.time }} - {{ task.date }}</p>
        <p>Дата сдачи: {{ task.deadline_date }}</p>
        <h3 class="important" v-if="task.importance === 1">важный</h3>
        <h3 class="general" v-else>oбщий</h3>
        <div class="comment" v-if="this.$parent.column.index === 1">
            <p v-if="task.returnReason !== '' ">{{ task.returnReason }}</p>
        </div>
        <div class="manipulation" v-if="!isLastColumn">
            <button v-if="isFirstColumn" @click="delTask">Удалить задачу</button>
            <div v-if="this.$parent.column.index !== 2">
                <button @click="movee"><--</button>
            </div>
            <div v-if="this.$parent.column.index === 2">
                <button @click="returnToActive"><--</button>
            </div>
            <button @click="move">--></button>
            <button @click="toggleEditing">{{ task.isEditing ? 'Save' : 'Редактировать' }}</button>
        </div>
        <div v-if="isLastColumn">
            <p v-if="isTaskOverdue">Сделано не в срок!</p>
            <p class="comlited" v-else>Сделано вовремя!</p>
        </div>
    </div>
    `,
    methods: {
        start(event) {
            event.dataTransfer.setData('task', JSON.stringify(this.task));
        },
        toggleEditing() {
            this.task.isEditing = !this.task.isEditing;
            this.task.time = new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
            this.task.date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
            this.$emit('update-task', this.task);
            location.reload()
            localStorage.setItem('task_' + this.task.title + '_isEditing', this.task.isEditing);
        },
        returnToActive() {
            const reason = prompt("Укажите причину возврата задания:");
            if (reason) {
                if (!this.task.returnReason) {
                    this.$set(this.task, 'returnReason', []); // Инициализация как пустого массива
                }
                this.task.returnReason.push(reason); 
                this.$emit('movee-task', { task: this.task, column: this.$parent.column });
            }
        },
        delTask(task){
            this.$emit('del-task', task);
        },
        move() {
            this.$emit('move-task', { task: this.task, column: this.$parent.column });
        },
        movee() {
            this.$emit('movee-task', { task: this.task, column: this.$parent.column });
        },
    },
    computed: {
        isLastColumn() {
            return this.$parent.column.index === 3;
        },
        isFirstColumn() {
            return this.$parent.column.index === 0;
        },
        isTaskOverdue() {
            return new Date(this.task.date) > new Date(this.task.deadline_date);
        },
    }
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
                this.$emit('movee-task', { task: task, column: column });
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
        movee(data) {
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