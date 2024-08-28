// ==UserScript==
// @name                    Custom Bilibili Auto Follow/Unfollow
// @namespace               https://github.com/Larch4/Custom-Bilibili-Auto-Follow-Unfollow
// @version                 1.6
// @description             A script to automatically follow/unfollow on Bilibili with a Bilibili-style UI
// @author                  Larch4
// @match                   https://space.bilibili.com/*
// @grant                   none
// @license                 GNU Affero General Public License v3.0
// ==/UserScript==

(function() {
    'use strict';

    let intervalId = null;
    let isRunning = false;

    // 创建控制面板
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.bottom = '20px';
    panel.style.right = '20px';
    panel.style.backgroundColor = '#fff';
    panel.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    panel.style.color = '#333';
    panel.style.padding = '15px 20px';
    panel.style.borderRadius = '8px';
    panel.style.zIndex = '10000';
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.alignItems = 'center';

    // 添加标题
    const title = document.createElement('div');
    title.textContent = 'B站UP主全自动关注/取消关注油猴脚本';
    title.style.fontSize = '16px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.color = '#333';
    panel.appendChild(title);

    // 设置面板内容
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';

    controlsContainer.innerHTML = `
        <button id="toggleButton" style="background-color: #00a1d6; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;">开始</button>
        <span id="statusText" style="margin-left: 10px; font-size: 14px; color: #666;">未运行</span>
    `;

    panel.appendChild(controlsContainer);
    document.body.appendChild(panel);

    const toggleButton = document.getElementById('toggleButton');
    const statusText = document.getElementById('statusText');

    // 启动或暂停脚本
    toggleButton.addEventListener('click', function() {
        if (isRunning) {
            clearInterval(intervalId);
            toggleButton.textContent = '开始';
            toggleButton.style.backgroundColor = '#00a1d6'; // 哔哩哔哩的主要蓝色
            statusText.textContent = '未运行';
        } else {
            startAutoFollowUnfollow();
            toggleButton.textContent = '暂停';
            toggleButton.style.backgroundColor = '#f25d8e'; // 哔哩哔哩的次要粉色
            statusText.textContent = '运行中';
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

