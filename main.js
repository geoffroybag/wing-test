axios = require("axios")
class Item{
    constructor(id, weight, name){
        this.id = id;
        this.weight = weight;
        this.name = name;
    }
}

class Order{
    constructor(id, order_date, items){
        this.id = id;
        this.order_date = order_date;
        this.items = items;
        this.weight = 0
    }
}

class Parcel{
    constructor(order_id, id, palette_number,items, weight, tracking_id){
        this.order_id = order_id;
        this.id = id;
        this.palette_number = palette_number;
        this.items = items;
        this.weight = weight;
        this.tracking_id = tracking_id;
        this.price = 0;
    }

    // function to calculate price per parcel
    feesCalculator(){
        
        if(this.weight<=1){
            this.price= 1
        }
        else if(1<this.weight && this.weight<=5){
            this.price = 2
        }
        else if(5<this.weight && this.weight<=10){
            this.price = 3
        }
        else if(10<this.weight && this.weight<=20){
            this.price = 5
        }
        else {this.price=  10}
    }
}

// function to calculate total fees
function totalFeesCalculator(){
    parcels.forEach(oneParcel=>oneParcel.feesCalculator())
    var fees = parcels.reduce((acc,curr)=>{
        return acc + curr.price
    }, 0)
    return fees
}

const fs = require('fs');
const dataItems = JSON.parse(fs.readFileSync('items.json', 'utf8'));
const dataOrders = JSON.parse(fs.readFileSync('orders.json', 'utf8'));


const orders = []
for (i = 0; i < dataOrders.orders.length; i++) {
  orders.push(new Order(dataOrders.orders[i].id, dataOrders.orders[i].date, dataOrders.orders[i].items));
}

const items = []
for (i = 0; i < dataItems.items.length; i++) {
    items.push(new Item(dataItems.items[i].id, dataItems.items[i].weight, dataItems.items[i].name));
}

// loop to fetch item_weight from item data and paste into orders data for future calculation
for (i = 0; i < orders.length; i++) {
    let weightOrder = 0
    for (j = 0; j < orders[i].items.length; j++) {
        items.forEach(oneItem=>{
            if(orders[i].items[j].item_id == oneItem.id ){
                weightOrder += parseInt(oneItem.weight)*orders[i].items[j].quantity
                orders[i].items[j].item_weight = Number(oneItem.weight)
            }
        })
    }
    orders[i].weight = weightOrder
  }



const parcels = []

// variable to follow the parcel's weight during calculation
let weightParcel = 0

let parcelNumber = 0
let paletteNumber = 1

for (i = 0; i < orders.length; i++) {
    // we create a new parcel for each new order
    parcelNumber ++ 
    if(parcelNumber > 15){
        parcelNumber = 1
        paletteNumber ++
    }
    parcels.push(new Parcel(orders[i].id, parcelNumber,paletteNumber,[], 0, null));
    weightParcel = 0
    // we loop on each item of each order
    for (j = 0; j < orders[i].items.length; j++) {
        for (k=0; k<orders[i].items[j].quantity; k++){
            
            weightParcel += orders[i].items[j].item_weight
            // check it the parcel's weight is below 30kg
            if(weightParcel <30){
                // if yes we push the new item to the parcels' items' list
                parcels[parcels.length-1].weight += orders[i].items[j].item_weight
                const newItem = {
                    item_id : orders[i].items[j].item_weight,
                    item_weight : orders[i].items[j].item_weight,
                }
                parcels[parcels.length-1].items.push(newItem)
            }
            else{
                // if not we create a new parcel
                parcelNumber ++
                if(parcelNumber > 15){
                    parcelNumber = 1
                    paletteNumber ++
                }
                weightParcel = orders[i].items[j].item_weight
                parcels.push(new Parcel(orders[i].id, parcelNumber,paletteNumber,[], 0, null))
                parcels[parcels.length-1].weight = orders[i].items[j].item_weight
                const newItem = {
                    item_id : orders[i].items[j].item_weight,
                    item_weight : orders[i].items[j].item_weight,
                }
                parcels[parcels.length-1].items.push(newItem)
            }
        }
        }
}


function trackerIdGenerator(){
    parcels.forEach(oneParcel =>{
        axios.post("https://helloacm.com/api/random/?n=15")
        .then(response=>{
            oneParcel.tracking_id = response.data
            var jsonParcels = JSON.stringify(parcels)
            fs.writeFileSync('output.json', jsonParcels)
            
        })
        .catch(err=>console.log(err.message))
    })
}



console.log("total fees are : " + totalFeesCalculator() + "€")
trackerIdGenerator()
