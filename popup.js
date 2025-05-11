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
        this.weekParity = this.store.data?.time_weekParity??0;
    }

    today(){
        return this.weekType()+"-"+this.day();
    }
    tomorrow(){
        return this.weekType()+"-"+this.day();
    }
    
    day(){
        const locale = navigator.language;
        const today = new Date();
        const options = { weekday: "short" };
        return new Intl.DateTimeFormat(locale, options).format(today).toLowerCase();
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
        const weekParity = (this.#weekParity ===0)?1:0;
        this.store.save_weekParity(weekParity);
    }

    weekType(){
        //return A or B
        return (this.#weeksSinceSeptember1()%2 == this.#weekParity) ? "a" : "b"; 
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

class EveryThing{}

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

function listIncludesTitle(list,group){
    const group_title=group.title;
    const is_directMatch= list.includes(group_title);
    const is_indirectMatch = list
          .filter( item => !(typeof item === "string") )
          .some( item => titleStartsWith(item, group) )
    ;
    return is_directMatch || is_indirectMatch;
}

function titleStartsWith(obj,group){
    const group_title=group.title;
    const start=obj.sw;
    if (Array.isArray(start) ) {
        return start.some( item => group_title.startsWith(item));
    }else{
        return group_title.startsWith(start);
    }
}

class tabGroupController {
    
    static async #moveGroupsToWindowByStrategy(windowId, strategy, obj ){
        const allTabGroups= await chrome.tabGroups.query({});
        const tabGroups=
              allTabGroups
              .filter( group => strategy(obj,group) )
              .filter( group => group.windowId != windowId ) //:workaround: filter out null-operation ish: or else api will error.
        ;
        //debug_heading("all");
        //debug(allTabGroups.map(tg => tg.title));
        //debug_heading("filtered");
        //debug(tabGroups.map(tg => tg.title));
        for (const group of tabGroups){
            await chrome.tabGroups.move(
                group.id,
                { index: -1, windowId}
            );
        }
    }

    static async moveGroupsToWindowByName(windowId, listOfNames ){
        this.#moveGroupsToWindowByStrategy(windowId, listIncludesTitle, listOfNames );
    }

    static async moveGroupsToWindowByStartsWith(windowId, obj ){
        this.#moveGroupsToWindowByStrategy(windowId, titleStartsWith, obj );
    }

    static async moveGroupsToWindow(windowId, obj ){
        if (obj === EveryThing){
            chrome.windows.getCurrent()
                .then( current_window => {
                    this.#moveGroupsToWindowByStrategy(
                        windowId,
                        (o,group)=> group.windowId === current_window.id,
                        obj
                    );
                })
            ;
        }else if (Array.isArray(obj)){
            this.moveGroupsToWindowByName(windowId,obj);
        }else{
            this.moveGroupsToWindowByStartsWith(windowId,obj);
        }
    }
    
    static async hide(obj=EveryThing){
        const windowId=await StoreWindow.Id();
        this.moveGroupsToWindow(windowId, obj );
    }
    
    static async show(obj=EveryThing){
        const windowId=(await chrome.windows.getCurrent()).id;
        this.moveGroupsToWindow(windowId, obj );
    }
    static async only(obj=EveryThing){
        await tabGroupController.hide();
        tabGroupController.show(obj);
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
        this.enable_hide_show_all()
        this.enable_today_mode();
        this.enable_set_buttons('#meta-group-selector',"g:");
        this.enable_set_buttons('#tab-day-selector',"d:");
        this.enable_raw_group_buttons();
    }

    enable_hide_show_all(){
        document.querySelector('#mode #hide-all').addEventListener('click', async () => {
            tabGroupController.hide();
        });
        document.querySelector('#mode #show-all').addEventListener('click', async () => {
            tabGroupController.show();
        });  
    }
    
    enable_today_mode(){
        const day=Factory.the.time.today();
        const button=document.querySelector('#mode template#today-button').content.cloneNode(true);
        button.querySelector('#day').textContent=day;
        button.querySelector('#today').addEventListener('click', async () => {
            const data=Factory.the.store.data;
            console.log(data);
            const key="d:"+day;
            const value=data[key];
            tabGroupController.only(value);
        });
        document.querySelector('#mode #today-target').replaceChildren(button);
        document.querySelector('#mode #toggle-week').addEventListener('click', async () => {
            Factory.the.time.toggleWeekParity();
        });
    }
        
    #enable_item_buttons(iterable,target){
        const output=document.createElement('ul');
        const buttons_template=document.querySelector('#button-item');    
        iterable
            .forEach( item => {
                const buttons=buttons_template.content.cloneNode(true);
                buttons.querySelector("#name").textContent=item.name;
                buttons.querySelector("li").id=item.name;
                buttons.querySelector("button#hide").addEventListener('click', async () => {
                    tabGroupController.hide(item.value);
                });
                buttons.querySelector("button#show").addEventListener('click', async () => {
                    tabGroupController.show(item.value);
                });
                buttons.querySelector("button#only").addEventListener('click', async () => {
                    tabGroupController.only(item.value);
                });
                
                output.append(buttons);
            })
        ;
        document.querySelector(target).replaceChildren(output);
    }

    enable_set_buttons(target, set){
        const data= this.store.data;
        const iterable=
              Object.keys(data)
              .filter(key => key.startsWith(set))
              .map( key => ({"name":key.substring(2), "value":data[key]}))
        ;
        this.#enable_item_buttons(iterable, target);
    }
    
    enable_raw_group_buttons(){
        function is_uniq(value,index,array){
            //assumes sorted
            return (index ===0) || (value.name !== array[index-1].name);
        }
        const target="#group-selector";
        chrome.tabGroups.query({})
            .then(
                groups => {
                    const name_value_s=
                          groups
                          .toSorted( (a,b) => a.title.localeCompare(b.title) )
                          .map( tab => ({"name":tab.title, "value":[tab.title]}))
                          .filter(is_uniq)
                    ;
                    this.#enable_item_buttons(name_value_s, target);
                }
            )
        ;
    }
}

class Store extends ObservedSubject{
    data={};
    get store(){ return chrome.storage.sync;}
    save(){
       // const parity=Factory.the.time.weekParity;
        Promise.all([
            //this.store.set({"time_weekParity": parity}),
            this.store.set({
                //"g:all 7":["7x3","7x4","7y3", "7y4"],
                //"g:all 8":{"sw":"8"},
                "g:ex": ["ex"],
                //"g:all man": [{"sw":"man"},{"sw":"help"},"document"],
                //"g:all man2": {"sw": ["man", "help"]},
                "d:a-wed":["7x3","8x3"],
                "d:a-thu":["7x4","8x4"],
                "d:a-fri":["7y4","8y4"],
                "d:b-thu":["9x1","9y1"],
                "d:b-fri":["7x3","8x3"],
            })
        ]).then( values => {
        }).catch(error => {          
        });      
    }
    save_weekParity(parity){
        this.store.set({"time_weekParity": parity});
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
    start(){
        this.load();
        chrome.storage.onChanged.addListener((changes,namespace) => {
            this.load();
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

class Settings {
    constructor(store){
        this.store=store;
        this.observe_meta_set();
        this.observe_day_set();
        this.observe_today_set();
        this.observe_meta_startswith_set();
    }

    async #visible_tabgroups(){
        //tabgroups in current window
        const windowId= (await chrome.windows.getCurrent()).id;
        const tabGroups= await chrome.tabGroups.query({});
        const tabGroupNames =
              tabGroups
              .filter( group => group.windowId === windowId )
              .map( group => group.title)
        ;
        return tabGroupNames;
    }

    observe_meta_startswith_set(){
        const submit_button=
              document.querySelector('input[type="submit"][name="set-meta-starts-with"]');
        const name_input=document.querySelector('input[type="text"][name="meta-name"]');
        submit_button.addEventListener('click', async () => {
            const name="g:"+name_input.value;
            const value_input=
                  document.querySelector('input[type="text"][name="meta-starts-with"]');
            const save_item = {
                [name]: {"sw":value_input.value}
            };
            this.store.store.set(save_item);
        });
    }

    observe_meta_set(){
        const submit_button= document.querySelector('input[type="submit"][name="set-meta"]');
        const name_input=document.querySelector('input[type="text"][name="meta-name"]');
        submit_button.addEventListener('click', async () => {
            const name="g:"+name_input.value;
            this.#write_current_groups_to(name);
        });
    }
    observe_day_set(){
        const submit_button= document.querySelector('input[type="submit"][name="set-day"]');
        submit_button.addEventListener('click', async () => {
            const week_input=document.querySelector('input[type="radio"][name="week"]:checked');
            const day_input=document.querySelector('input[type="radio"][name="day"]:checked');
            const day=day_input.value;
            const week=week_input.value;
            const name="d:" +week+ "-" +day;
            this.#write_current_groups_to(name);
       });
    }

     observe_today_set(){
        const submit_button= document.querySelector('input[type="submit"][name="set-today"]');
        submit_button.addEventListener('click', async () => {       
            const name="d:"+Factory.the.time.today();
            this.#write_current_groups_to(name);
       });
    }

    async #write_current_groups_to(name){
        const tabGroupNames = await this.#visible_tabgroups();
        const save_item = {
            [name]: tabGroupNames
        };
        this.store.store.set(save_item);
    }
}

class Factory{
    static the = new Factory();

    constructor (){
        this.store = new Store();
        //this.store_observer=new SimpleStoreObserver(this.store);
        this.time = new Time(this.store);
        this.buttons=new Buttons(this.store);
        this.settings=new Settings(this.store);
    }
    static start(){
        this.the.store.start();
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
