"use strict";

class Observer{
    constructor(observedSubject){
        observedSubject.register(this);
    }
    update(){
    }
}

class ObservedSubject{
    observers=[];
    register(observer){
        this.observers.push(observer);
    }
    _notify(){
        this.observers.forEach( observer => {
            observer.update();
        });
    }
}

function PrettyJsonElementOf(obj){
    const result=document.createElement('pre');
    result.textContent=JSON.stringify(obj, null,2);
    return result;
}

function display_listitem(output, data){
    const element = li_template.content.cloneNode(true);
    element.querySelector('#title').textContent = data.title;
    element.querySelector('#content').replaceWith(
        PrettyJsonElementOf(data)
    );
    output.append(element);
}

function display({datas, heading}={}){
    const template = document.getElementById('template');  
    const section = template.content.cloneNode(true);
    section.querySelector('#heading').textContent = heading;
    const output_list=section.querySelector('ul#output-list');
    
    for (const data of datas) {
        display_listitem(output_list, data);
    }
    
    document.querySelector('#output').append(section);
}

class Time extends Observer{
    constructor(store){
        super(store);
        this.store=store;
    }
    update(){
        this.#weekParity = this.store.data.time_weekParity;
    }
    
    static day(){
        const locale = navigator.language;
        const today = new Date();
        const options = { weekday: "short" };
        return new Intl.DateTimeFormat(locale, options).format(today);
    }

    #weekParity = 0;

    get weekParity(){
        return this.#weekParity;
    }

    set weekParity(v){
        v=parseInt(v);
        if (v === 0 || v === 1){
            this.#weekParity=v;
        }else{
            throw new TypeError(`must be 0 or 1. got ${v}`);
        }
    }

    toggleWeekParity(){
        if (this.#weekParity ===0){ this.#weekParity=1;}
        else{ this.#weekParity=0;}
    }

    weekType(){
        //return A or B
        return (this.#weeksSinceSeptember1()%2 == this.#weekParity) ? "A" : "B"; 
    }

    #weeksSinceSeptember1() {
        const current = new Date();
        const milliSecondsSince=current - this.#lastSeptember();
        const result = Math.floor(milliSecondsSince /1000 /60 /60 /24 /7);
        return result;
    }

    #lastSeptember(){
        const currentYear = new Date().getFullYear();
        const today = new Date();
        let septemberFirst = new Date(currentYear, 8, 1);
        if (today < septemberFirst) {
            septemberFirst.setFullYear(septemberFirst.getFullYear() -1 )
        }
        return septemberFirst;
    }
}

class EveryThing{
    includes(x){
        return true;
    }
}

class StoreWindow {
    static async #create(){
        await chrome.windows.create({state:"minimized",url:"flag.html"});
    }

    static async Id(){
        let result=await this.#Id();
        if (result === null) {
            //fix and retry
            await this.#create();
            result=await this.#Id();
        }
        return result;
    }
    
    static async #Id(){
        let result=null;
        const windows = await chrome.windows.getAll({populate:true});
        const list = (
            windows
                .filter( window => this.#isStoreWindow(window) )
                .map(window => window.id)
        );
        if (list.length === 1){
            result=list[0]; //:kluge:assume only one
        }  
        return result;
    }

    static #isStoreWindow(window){
        const result = window.tabs.some(
            tab=> tab.url.endsWith("flag.html" ));
        return result;
    }
}

class tabGroupController {

    static #listIncludes(list,item){
        return list.includes(item);
    }

    static #startsWith(obj,item){
        const start=obj.sw;
        return item.startsWith(start);
    }
    
    static async #moveGroupsToWindowByStrategy(windowId, strategy, obj ){
        const tabGroups= await chrome.tabGroups.query({});
        tabGroups
            .filter( group => strategy(obj,group.title) )
            .filter( group => group.windowId != windowId ) //:workaround: filter out null-operation ish: or else api will error.
            .forEach(
                group => {
                    chrome.tabGroups.move(
                        group.id,
                        { index: -1, windowId}
                    );
                }
            )
        ;
    }

    static async moveGroupsToWindowByName(windowId, listOfNames ){
        this.#moveGroupsToWindowByStrategy(windowId, this.#listIncludes, listOfNames );
    }

    static async moveGroupsToWindowByStartsWith(windowId, obj ){
        this.#moveGroupsToWindowByStrategy(windowId, this.#startsWith, obj );
    }
    
    static async hide(list=new EveryThing()){
        const windowId=await StoreWindow.Id();
        this.moveGroupsToWindowByStartsWith(windowId,list);
    }
    
    static async show(list=new EveryThing()){
        const windowId=(await chrome.windows.getCurrent()).id;
        this.moveGroupsToWindowByStartsWith(windowId,list);
    }
}

class Buttons extends Observer{
    constructor(store) {
        super(store);
        this.store=store;
    }
    update(){
        this.enable_buttons();   
    }
    
    enable_buttons(){
        const output= document.querySelector('#tab-group-selector ul');
        const buttons_template=document.querySelector('#tab-group-selector ul #item');
        const data=this.store.data;
        const keys= Object.keys(data)
              .filter(key => key.startsWith("g:"))
        ;
        debug_heading("buttons");
        debug(JSON.stringify(keys));
        keys.forEach( key => {
            const name=key.substring(2);
            const value=data[key];
            debug(JSON.stringify([key,value]));

            const buttons=buttons_template.content.cloneNode(true);
            buttons.querySelector("#name").textContent=name;
            buttons.querySelector("li").id=name;
            buttons.querySelector("button#hide").addEventListener('click', async () => {
                tabGroupController.hide(value);
            });
            buttons.querySelector("button#show").addEventListener('click', async () => {
                tabGroupController.show(value);
            });
            
            output.append(buttons);
        });
    }
}

class Store extends ObservedSubject{
    data={};
    get store(){ return chrome.storage.sync;}
    save(){
        debug("hello");
        const parity=Factory.the.time.weekParity;
        debug(parity);
        Promise.all([
            this.store.set({"time_weekParity": parity}),
            this.store.set({
                "g:all 7":["7x3","7x4","7y3", "7y4"],
                "g:all 8":{"sw":"8"},
                "g:all man": [{"sw":"man"},{"sw":"help"},"document"],
            })
        ]).then( values => {
        }).catch(error => {          
        });      
    }
    load(){
        this.store.get().then( data => {
            this.data=data;
            if (data){
                this._notify();
            }
        }).catch(error =>{
        });
    }
}

class SimpleStoreObserver extends Observer {
    constructor(store){
        super(store);
        this.store=store;
    }
    update(){
        debug_heading("simple store observer")
        debug_element(PrettyJsonElementOf(this.store.data));
    }
}

class Factory{
    static the = new Factory();

    constructor (){
        this.store = new Store();
        //this.store_observer=new SimpleStoreObserver(this.store);
        this.time = new Time(this.store);
        this.buttons=new Buttons(this.store);

        this.store.load();
    }
}

function debug(msg){
    const out=document.createElement('p');
    out.textContent=msg;
    document.querySelector('#output').append(out);
}
function debug_heading(msg){
    const out=document.createElement('h2');
    out.textContent=msg;
    document.querySelector('#output').append(out);
}
function debug_element(element){
    document.querySelector('#output').append(element);
}

//Factory.the.store.save();
