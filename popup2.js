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

class tabGroupController {

    static async #createStoreWindow(){
        await chrome.windows.create({state:"minimized",url:"flag.html"});
    }

    static async storeWindowId(){
        var result=await this.#storeWindowId();
        if (result === null) {
            //fix and retry
            await this.#createStoreWindow();
            result=await this.#storeWindowId();
        }
        return result;
    }
    
    static async #storeWindowId(){
        var result=null;
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
    
    static async hide(){
        const windowId=await this.storeWindowId();
        this.moveGroupsToWindow(windowId);
    }
    
    static async show(){
        const window=await chrome.windows.getCurrent();
        this.moveGroupsToWindow(window.id);
    }
}

class Buttons{
    constructor() {
        this.enable_buttons();
    }
    
    enable_buttons(){
        document.querySelector('button#hide').addEventListener('click', async () => {
            tabGroupController.hide();
        });
        document.querySelector('button#show').addEventListener('click', async () => {
            tabGroupController.show();
        });
    }
}


function debug(msg){
    const out=document.createElement('p');
    out.textContent=msg;
    document.querySelector('#output').append(out);
}

//const groups = await chrome.tabGroups.query({});
//display({datas:groups,heading:"Debug—Tab Groups"});

//const windows = await chrome.windows.getAll({populate:true});
//display({datas:windows,heading:"Windows"});

//const current_window= await chrome.windows.getCurrent();
//document.querySelector('#output').append(`current window id: ${current_window.id}`);

const buttons=new Buttons();
const store_id = await tabGroupController.storeWindowId();
debug(`store window: ${store_id}`);
const current_window_id= (await chrome.windows.getCurrent()).id;
debug(`current window: ${current_window_id}`);
