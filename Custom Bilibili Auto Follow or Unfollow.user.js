// ==UserScript==
// @name                     Custom Bilibili Auto Follow/Unfollow
// @namespace                https://github.com/Larch4/Custom-Bilibili-Auto-Follow-Unfollow
// @version                  1.3
// @description              A script to automatically follow/unfollow on Bilibili with a start/pause button
// @author                   Larch4
// @match                    https://space.bilibili.com/*
// @grant                    none
// @license                  GNU Affero General Public License v3.0
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
    panel.style.backgroundColor = 'rgba(255, 75, 156, 0.918)';
    panel.style.color = '#black';
    panel.style.padding = '20px';
    panel.style.borderRadius = '5px';
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

    // 关注和取消关注函数
    function followOrUnfollow(action) {
        if (action === 1) {
            const unfollowButton = document.querySelectorAll(".be-dropdown-item")[1];
            if (unfollowButton) {
                unfollowButton.click();
            } else {
                console.error("未找到取消关注按钮");
            }
        } else {
            const followButton = document.querySelector(".h-f-btn.h-follow");
            if (followButton) {
                followButton.click();
            } else {
                console.error("未找到关注按钮");
            }
        }
    }

    function startAutoFollowUnfollow() {
        let toggle = 0;
        intervalId = setInterval(() => {
            toggle = 1 - toggle; // 在 0 和 1 之间切换
            setTimeout(() => {
                followOrUnfollow(toggle);
            }, 1000);
        }, 3000);
    }
})();
