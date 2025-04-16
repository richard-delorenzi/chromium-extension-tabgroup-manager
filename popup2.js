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

    today(){
        return this.weekType()+"-"+this.day();
    }
    
    day(){
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

function listIncludes(list,group_title){
    const is_directMatch= list.includes(group_title);
    const is_indirectMatch = list
          .filter( item => !(typeof item === "string") )
          .some( item => startsWith(item, group_title) )
    ;
    return is_directMatch || is_indirectMatch;
}

function startsWith(obj,group_title){
    const start=obj.sw;
    if (Array.isArray(start) ) {
        return start.some( item => group_title.startsWith(item));
    }else{
        return group_title.startsWith(start);
    }
}

class tabGroupController {
    
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
        this.#moveGroupsToWindowByStrategy(windowId, listIncludes, listOfNames );
    }

    static async moveGroupsToWindowByStartsWith(windowId, obj ){
        this.#moveGroupsToWindowByStrategy(windowId, startsWith, obj );
    }

    static async moveGroupsToWindow(windowId, obj ){
        if (Array.isArray(obj)){
            this.moveGroupsToWindowByName(windowId,obj);
        }else{
            this.moveGroupsToWindowByStartsWith(windowId,obj);
        }
    }
    
    static async hide(obj=new EveryThing()){
        const windowId=await StoreWindow.Id();
        this.moveGroupsToWindow(windowId, obj );
    }
    
    static async show(obj=new EveryThing()){
        const windowId=(await chrome.windows.getCurrent()).id;
        this.moveGroupsToWindow(windowId, obj );
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
        this.enable_mode();
        this.enable_set_buttons('#tab-group-selector ul',"g:");
        this.enable_set_buttons('#tab-day-selector ul',"d:");
    }

    enable_mode(){
        const day=Factory.the.time.today();
        debug(day);
        document.querySelector('#mode p').textContent=day;     
    }

    enable_set_buttons(target, set){
        const output= document.querySelector(target);
        const buttons_template=document.querySelector('#button-item');
        const data=this.store.data;
        
        Object.keys(data)
            .filter(key => key.startsWith(set))
            .forEach( key => {
            const name=key.substring(2);
            const value=data[key];

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
        const parity=Factory.the.time.weekParity;
        debug(parity);
        Promise.all([
            this.store.set({"time_weekParity": parity}),
            this.store.set({
                "g:all 7":["7x3","7x4","7y3", "7y4"],
                "g:all 8":{"sw":"8"},
                //"g:all man": [{"sw":"man"},{"sw":"help"},"document"],
                //"g:all man2": {"sw": ["man", "help"]},
                "d:a-wed":["7x3","8x3"],
                "d:a-thur":["7x4","8x4"],
            })
        ]).then( values => {
        }).catch(error => {          
        });      
    }
    load(){
        this.store.get()
            .then( data => {
                this.data=data;
                if (data){
                    this._notify();
                }
            }).catch(error =>{
            })
        ;
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
        this.store_observer=new SimpleStoreObserver(this.store);
        this.time = new Time(this.store);
        this.buttons=new Buttons(this.store);
    }
    static start(){
        this.the.store.load();
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

Factory.start();
//Factory.the.store.save();
