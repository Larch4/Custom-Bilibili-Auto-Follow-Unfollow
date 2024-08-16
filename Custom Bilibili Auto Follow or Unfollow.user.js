// ==UserScript==
// @name         Custom Bilibili Auto Follow/Unfollow
// @namespace    https://github.com/Larch4/Custom-Bilibili-Auto-Follow-Unfollow
// @version      1.0
// @description  A script to automatically follow/unfollow on Bilibili with a start/pause button
// @author       Larch4
// @match        https://space.bilibili.com/401742377
// @grant        none
// ==/UserScript==

(function() {
        'use strict';
    
        let intervalId = null;
        let isRunning = false;
    
        // 创建控制面板
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.bottom = '10px';
        panel.style.right = '10px';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        panel.style.color = '#fff';
        panel.style.padding = '10px';
        panel.style.zIndex = '10000';
        panel.innerHTML = `
            <button id="toggleButton">开始</button>
        `;
        document.body.appendChild(panel);
    
        const toggleButton = document.getElementById('toggleButton');
    
        // 启动或暂停脚本
        toggleButton.addEventListener('click', function() {
            if (isRunning) {
                clearInterval(intervalId);
                toggleButton.textContent = '开始';
            } else {
                startAutoFollowUnfollow();
                toggleButton.textContent = '暂停';
            }
            isRunning = !isRunning;
        });
    
        // 你现有的功能代码
        function O(number) {
            if (number == 1) {
                document.getElementsByClassName("be-dropdown-item")[1].click();
            } else {
                document.getElementsByClassName("h-f-btn h-follow")[0].click();
            }
        }
    
        function startAutoFollowUnfollow() {
            let x = 0;
            intervalId = setInterval(() => {
                if (x == 1) {
                    x = 0;
                } else {
                    x = 1;
                }
                setTimeout(() => {
                    O(x);
                }, 1000);
            }, 3000);
        }
    })();
