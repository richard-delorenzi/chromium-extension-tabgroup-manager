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
    isStoreWindow(window){
        const result = window.tabs.some(
            tab=> tab.url.endsWith("chrome-extensions/chrome-extension-1/flag.html" ));
        return result;
    }
    
    async storeWindowId(){
        const windows = await chrome.windows.getAll({populate:true});
        const result = (
            windows
                .filter( window => this.isStoreWindow(window) )
                .map(window => window.id)
            [0] //assume only one
        );
        return result;
    }

    async moveTabsToWindow(windowId){
        const tabGroups= await chrome.tabGroups.query({});
        tabGroups.filter( group => ["1","2"].includes(group.title) )
            .forEach(
                group => {
                    chrome.tabGroups.move(
                        group.id,
                        { index: -1, windowId}
                    );
                }
            );
    }
    
    async hide(){
        const windowId=await this.storeWindowId();
        this.moveTabsToWindow(windowId);
    }
    
    async show(){
        const window=await chrome.windows.getCurrent();
        this.moveTabsToWindow(window.id);
    }
}

class Buttons{
    constructor() {
        this.controller=new tabGroupController();
        this.enable_buttons();
    }
    
    enable_buttons(){
        document.querySelector('button#hide').addEventListener('click', async () => {
            this.controller.hide();
        });
        document.querySelector('button#show').addEventListener('click', async () => {
            this.controller.show();
        });
    }
}


const groups = await chrome.tabGroups.query({});
display({datas:groups,heading:"Debug—Tab Groups"});

//const windows = await chrome.windows.getAll({populate:true});
//display({datas:windows,heading:"Windows"});

const current_window= await chrome.windows.getCurrent();
document.querySelector('#output').append(`current window id: ${current_window.id}`);

new Buttons();
