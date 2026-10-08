// 2. Обробка та валідація введених даних
//
// Перш ніж створити замовлення, програма перевіряє:
//
//     номер замовлення не порожній, має формат «дві великі літери, дефіс, цифри» і ще не існує в списку;
// адреса не порожня і не складається лише з пробілів;
// вага — число, більше за 0 і не більше за 30 кг;
// час доставки заповнений і не в минулому.
//
//     Якщо дані некоректні, біля відповідного поля з'являється зрозуміле повідомлення. Замовлення не додається, а введені значення залишаються у формі.
//
// Теги обробляються так: рядок розбивається за комами, зайві пробіли прибираються, порожні елементи відкидаються, усе переводиться в нижній регістр.
//     Однакові теги не повторюються, тому всередині замовлення вони зберігаються як множина (Set).

let orderNumberInput = document.getElementById("orderNumber");
let orderNumberError = document.getElementById("orderNumberError");
let addressInput = document.getElementById("address");
let addressError = document.getElementById("addressError");
let weightInput = document.getElementById("weight");
let weightError = document.getElementById("weightError");
let deliveryTimeInput = document.getElementById("deliveryTime");
let deliveryTimeError = document.getElementById("deliveryTimeError");
let tagsInput = document.getElementById("tags");
let tagsError = document.getElementById("tagsError");
let addOrderButton = document.getElementById("addOrder");
let ordersList = document.getElementById("orders");
let showOnlyOverdueCheckbox = document.getElementById("showOnlyOverdue");
let ordersCounter = document.getElementById("ordersCounter");

let tags;
function validateOrder() {
    tags = new Set(tagsInput.value.split(",").map(tag => tag.trim().toLowerCase()).filter(tag => tag !== ""));
    if(orderNumberInput.value.trim() === "") {
        orderNumberError.textContent = "Номер замовлення не може бути порожнім";
        return false;
    }
    if(!/^[A-Z]{2}-\d{4}$/.test(orderNumberInput.value)) {
        orderNumberError.textContent = "Номер замовлення має бути у форматі «дві великі літери, дефіс, цифри»";
        return false;
    }
    if (orders.some(order => order.number === orderNumberInput.value)) {
        orderNumberError.textContent = "Замовлення з таким номером вже існує";
        return false;
    }
    if(addressInput.value.trim() === "") {
        addressError.textContent = "Адреса доставки не може бути порожньою";
        return false;
    }
    if(weightInput.value.trim() === "") {
        weightError.textContent = "Вага посилки не може бути порожньою";
        return false;
    }
    if(parseFloat(weightInput.value) <= 0 || parseFloat(weightInput.value) > 30 || isNaN(parseFloat(weightInput.value))) {
        weightError.textContent = "Вага посилки має бути більшою за 0 та меншою за 30";
        return false;
    }
    if(!deliveryTimeInput.value) {
        deliveryTimeError.textContent = "Час доставки не може бути порожнім";
        return false;
    }
    let day = new Date(deliveryTimeInput.value);
    if(day < new Date()) {
        deliveryTimeError.textContent = "Час доставки не може бути меншим за поточний час";
        return false;
    }
    return true;
}

// 3. Клас замовлення

// Створіть клас Order з такими властивостями:

//     номер;
// адреса;
// вага;
// час доставки (обов'язково як об'єкт Date, а не рядок);
// теги (Set);
// статус: «нове», «в дорозі» або «доставлено»;
// момент створення замовлення (Date).

//     Методи класу:

//     isOverdue() — повертає true, якщо час доставки минув, а замовлення ще не доставлено;
// addTag(tag) — додає тег за тими самими правилами очищення;
// nextStatus() — переводить замовлення в наступний статус; після «доставлено» статус не змінюється

const status = Object.freeze({
    NEW: "нове",
    IN_TRANSIT: "в дорозі",
    DELIVERED: "доставлено"
})

class Order {
    number;
    address;
    weight;
    deliveryTime;
    tags;
    status;
    createdAt;
    constructor(number, address, weight, deliveryTime, tags = new Set(), orderStatus = status.NEW, createdAt = new Date()) {
        this.number = number;
        this.address = address;
        this.weight = weight;
        this.deliveryTime = deliveryTime instanceof Date ? deliveryTime : new Date(deliveryTime);
        this.tags = tags instanceof Set ? tags : new Set(tags);
        this.status = orderStatus;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    }
    isOverdue() {
        return this.deliveryTime < new Date() && this.status !== status.DELIVERED;
    }
    addTag(tag) {
        tag = tag.trim();
        if(!tag) return;
        this.tags.add(tag);
    }
    nextStatus() {
        if(this.status === status.DELIVERED) return;
        if(this.status === status.NEW) this.status = status.IN_TRANSIT;
        if(this.status === status.IN_TRANSIT) this.status = status.DELIVERED;
    }
    // 4. Власна серіалізація і десеріалізація
    //
    // У класі Order реалізуйте метод toJSON, який визначає вигляд замовлення в JSON:
    //
    //     теги — відсортований масив рядків;
    // дати — рядки у форматі ISO;
    // додаткове поле v зі значенням 1 (версія формату).
    //
    // Створіть статичний метод Order.fromJSON, який з отриманого після JSON.parse простого об'єкта будує справжній екземпляр Order з Date і Set.
    // Він має кидати зрозумілу помилку, якщо немає номера чи часу доставки або версія формату не 1.
    //
    // Для читання з localStorage використайте JSON.parse з функцією-reviver. Вона перетворює на Date ті поля, назва яких закінчується на At.

    toJSON(){
        return {
            number: this.number,
            address: this.address,
            weight: this.weight,
            deliveryTime: this.deliveryTime.toISOString(),
            tags: [...this.tags].sort(),
            status: this.status,
            createdAt: this.createdAt.toISOString(),
            v: 1
        }
    }
    static fromJSON(json){
        if(!json.number || !json.deliveryTime) throw new Error('Invalid order');
        if(json.v !== 1) throw new Error('Unsupported version');
        return new Order(json.number, json.address, json.weight, new Date(json.deliveryTime), new Set(json.tags), json.status, new Date(json.createdAt));
    }
}

// 5. Збереження в localStorage
//
// Після кожної зміни (додавання замовлення, зміна статусу, видалення) весь список зберігається під одним ключем.
//     Під час відкриття сторінки список завантажується з localStorage.
//     Якщо ключа ще немає, сторінка показує порожній список без помилок.
//     Якщо дані зіпсовані (наприклад, вручну змінені в DevTools), сторінка показує повідомлення «Збережені дані пошкоджено» і стартує з порожнім списком, а не падає.

let orders = [];

function loadOrders() {
    const rawData = localStorage.getItem('orders');

    if (!rawData) {
        return;
    }

    try {
        const parsed = JSON.parse(rawData);

        if (!Array.isArray(parsed)) {
            throw new Error('Дані в localStorage не є масивом');
        }

        orders = parsed.map(item => Order.fromJSON(item));

    } catch (error) {
        console.error('Помилка завантаження даних:', error);

        tagsError.InnerText = 'Збережені дані пошкоджено'
        orders = [];
    }
}

function saveOrders() {
    localStorage.setItem('orders', JSON.stringify(orders));
}

addOrderButton.addEventListener("click", () => {
    if (validateOrder()) {
        let order = new Order(orderNumberInput.value, addressInput.value, weightInput.value, new Date(deliveryTimeInput.value), tags, status.NEW, new Date());
        orders.push(order);
        saveOrders();
        renderOrders();
    }
})

function renderOrders() {
    ordersList.innerHTML = '';
    // 6. Відображення списку
    //
    // Кожне замовлення відображається карткою або рядком таблиці: номер, адреса, вага, час доставки в зручному форматі, теги, статус.
    //     Прострочені замовлення виділяються кольором. Біля кожного замовлення є кнопки «Наступний статус» і «Видалити».
    const total = orders.length;
    const overdue = orders.filter(order => order.isOverdue()).length;
    const delivered = orders.filter(order => order.status === status.DELIVERED).length;
    ordersCounter.textContent = `усього: ${total} / затримка: ${overdue} / доставлено: ${delivered}`;
    orders.forEach(order => {
        if (showOnlyOverdueCheckbox.checked && !order.isOverdue())
            return;
        let li = document.createElement('li');
        if(order.isOverdue())
            li.style.color = 'red';
        let del = document.createElement('button');
        let changeStatus = document.createElement('button');
        del.textContent = 'Delete';
        changeStatus.textContent = 'Next status';
        del.style.marginLeft = '10px';
        changeStatus.style.marginLeft = '10px';
        del.addEventListener('click', () => {
            orders = orders.filter(o => o.number !== order.number);
            saveOrders();
            renderOrders();
        });
        changeStatus.addEventListener('click', () => {
            order.nextStatus();
            saveOrders();
            renderOrders();
        });
        li.textContent = `${order.number} - ${order.address} - ${order.weight} - ${order.deliveryTime} - ${order.tags && order.tags.size > 0 ? Array.from(order.tags).join(', ') : ' нема '} - ${order.status}`;
        li.appendChild(del);
        li.appendChild(changeStatus);
        ordersList.appendChild(li);
    });
}

showOnlyOverdueCheckbox.addEventListener('change', () => {
    renderOrders();
});

loadOrders();
renderOrders();