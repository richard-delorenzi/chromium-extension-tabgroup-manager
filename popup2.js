"use strict";

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

class Time {
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

class tabGroupController {

    static async #createStoreWindow(){
        await chrome.windows.create({state:"minimized",url:"flag.html"});
    }

    static async storeWindowId(){
        let result=await this.#storeWindowId();
        if (result === null) {
            //fix and retry
            await this.#createStoreWindow();
            result=await this.#storeWindowId();
        }
        return result;
    }
    
    static async #storeWindowId(){
        let result=null;
        const windows = await chrome.windows.getAll({populate:true});
        const list = (
            windows
                .filter( window => this.isStoreWindow(window) )
                .map(window => window.id)
        );
        if (list.length === 1){
            result=list[0]; //:kluge:assume only one
        }  
        return result;
    }

    static isStoreWindow(window){
        const result = window.tabs.some(
            tab=> tab.url.endsWith("flag.html" ));
        return result;
    }

    static async moveGroupsToWindow(windowId){
        this.moveGroupsByNameToWindow(windowId,["1","2"]);
    }
        
    static async moveGroupsByNameToWindow(windowId, listOfNames ){
        const tabGroups= await chrome.tabGroups.query({});
        tabGroups
            .filter( group => listOfNames.includes(group.title) )
            .filter( group => group.windowId != windowId ) //:workaround: filter out null-operation ish: as errors.
            .forEach(
                group => {
                    chrome.tabGroups.move(
                        group.id,
                        { index: -1, windowId}
                    );
                }
            );
    }
    
    static async hide(list=new EveryThing()){
        const windowId=await this.storeWindowId();
        this.moveGroupsByNameToWindow(windowId,list);
    }
    
    static async show(list=new EveryThing()){
        const windowId=(await chrome.windows.getCurrent()).id;
        this.moveGroupsByNameToWindow(windowId,list);
    }
}

class Buttons{
    constructor(store) {
        this.store=store;
        this.enable_buttons();
    }
    
    enable_buttons(){
        debug("here");
        const store=this.store.store;
        store.getKeys().then( keys => {
            debug(JSON.stringify(keys));
            const g_keys=keys.filter( key => key.startsWith("g:") );
            debug(JSON.stringify(g_keys));
            g_keys.forEach(
                key => {
                  
                }
            );
        });
        debug("here");



        
        // const output=document.querySelector('#tab-group-selector ul')
        //const item=document.createElement('p');result.textContent="hello";
        //output.append(item);
        
        //document.querySelector('button#hide-all').addEventListener('click', async () => {
        //    tabGroupController.hide();
        //});
        
    }
}

class Store{
    get store(){ return chrome.storage.sync;}
    save(){
        debug("hello");
        const parity=Factory.the.time.weekParity;
        debug(parity);
        Promise.all([
            this.store.set({"time_weekParity": parity}),
            this.store.set({
                "g:all 7":["7x3","7x4","7y3", "7y4"],
                "g:all 8":["8x3","8x4","8y3", "8y4"],
            })
        ]).then( values => {
        }).catch(error => {          
        });      
    }
    async load({time}={}){
        this.data= await this.store.get();
        const data=this.data;
        display({datas:[data],heading:"load data"});
        if (data){
            time.weekParity= data.time_weekParity;
        }
    }
}

class Factory{
    static the = new Factory();

    constructor (){
        this.store = new Store();
        this.time = new Time();
        this.store.load({time:this.time});
        this.buttons=new Buttons(this.store);
    }
}

function debug(msg){
    const out=document.createElement('p');
    out.textContent=msg;
    document.querySelector('#output').append(out);
}

const factory=Factory.the;


//Factory.the.store.save();
