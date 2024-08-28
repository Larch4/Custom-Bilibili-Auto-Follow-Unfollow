// ==UserScript==
// @name         Custom Bilibili Auto Follow/Unfollow
// @namespace    https://github.com/Larch4/Custom-Bilibili-Auto-Follow-Unfollow
// @version      4.0
// @description  A script to automatically follow/unfollow on Bilibili with enhanced UI and controls.
// @author       Larch4
// @match        https://space.bilibili.com/*
// @grant        none
// @license      GNU Affero General Public License v3.0
// @downloadURL  https://update.greasyfork.org/scripts/504985/Custom%20Bilibili%20Auto%20FollowUnfollow.user.js
// @updateURL    https://update.greasyfork.org/scripts/504985/Custom%20Bilibili%20Auto%20FollowUnfollow.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const FOLLOW_INTERVAL_DEFAULT = 3000; // 关注时间间隔（默认15秒）
    const UNFOLLOW_INTERVAL_DEFAULT = 3000; // 取消关注时间间隔（默认3秒）

    let timeoutId = null;
    let isRunning = false;
    let followInterval = FOLLOW_INTERVAL_DEFAULT;
    let unfollowInterval = UNFOLLOW_INTERVAL_DEFAULT;

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'bilibili-auto-follow-panel';
        panel.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background-color: #fff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            color: #333; padding: 15px; border-radius: 10px; z-index: 10000;
            display: flex; flex-direction: column; align-items: stretch; width: 240px;
            font-family: Arial, sans-serif;
        `;

        panel.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; text-align: center; color: #00a1d6;">Bilibili 自动关注脚本</div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <button id="toggleButton" style="
                    flex: 1; background-color: #00a1d6; color: #fff; border: none; padding: 8px 12px;
                    border-radius: 6px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;
                ">开始</button>
                <span id="statusText" style="flex: 1; margin-left: 50px; font-size: 14px; color: #666;">未运行</span>
            </div>

            <div style="margin-bottom: 10px; display: flex; flex-direction: column;">
                <label>关注间隔（秒）：</label>
                <input id="followIntervalInput" type="number" min="1" value="${FOLLOW_INTERVAL_DEFAULT / 1000}" style="
                    width: 95%; padding: 5px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;
                ">
            </div>
            <div style="margin-bottom: 10px; display: flex; flex-direction: column;">
                <label>取消关注间隔（秒）：</label>
                <input id="unfollowIntervalInput" type="number" min="1" value="${UNFOLLOW_INTERVAL_DEFAULT / 1000}" style="
                    width: 95%; padding: 5px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;
                ">
            </div>

            <div id="logContainer" style="
                max-height: 120px; overflow-y: auto; border: 1px solid #ddd; padding: 5px; margin-top: 10px; border-radius: 4px;
                font-size: 12px; color: #333; background-color: #f9f9f9;
            "></div>

            <div id="errorMessage" style="color: red; font-size: 12px; margin-top: 10px;"></div>
        `;
        document.body.appendChild(panel);
        makePanelDraggable(panel);

        const toggleButton = panel.querySelector('#toggleButton');
        toggleButton.addEventListener('click', toggleScript);

        panel.querySelector('#followIntervalInput').addEventListener('input', (e) => {
            followInterval = parseInt(e.target.value, 10) * 1000;
        });
        panel.querySelector('#unfollowIntervalInput').addEventListener('input', (e) => {
            unfollowInterval = parseInt(e.target.value, 10) * 1000;
        });

        return {
            toggleButton,
            statusText: panel.querySelector('#statusText'),
            errorMessage: panel.querySelector('#errorMessage'),
            logContainer: panel.querySelector('#logContainer')
        };
    }

    function makePanelDraggable(panel) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        panel.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SPAN' || e.target.tagName === 'INPUT') return; // 防止拖动按钮或其他可点击元素
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            e.preventDefault();

            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            panel.style.left = `${panel.offsetLeft}px`;
            panel.style.top = `${panel.offsetTop}px`;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (isDragging) {
                panel.style.left = `${e.clientX - offsetX}px`;
                panel.style.top = `${e.clientY - offsetY}px`;
            }
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    function toggleScript() {
        if (isRunning) {
            stopAutoFollowUnfollow();
        } else {
            startAutoFollowUnfollow();
        }
        isRunning = !isRunning;
    }

    function startAutoFollowUnfollow() {
        toggleFollowState(0); // 开始时默认进入取消关注状态
        updateUI('暂停', '#f25d8e', '运行中');
    }

    function stopAutoFollowUnfollow() {
        clearTimeout(timeoutId);
        updateUI('开始', '#00a1d6', '未运行');
    }

    function updateUI(buttonText, buttonColor, statusTextValue) {
        const toggleButton = document.getElementById('toggleButton');
        const statusText = document.getElementById('statusText');
        toggleButton.textContent = buttonText;
        toggleButton.style.backgroundColor = buttonColor;
        statusText.textContent = statusTextValue;
    }

    function toggleFollowState(action) {
        followOrUnfollow(action);
        const nextAction = action === 0 ? 1 : 0;  // 下一个动作
        const delay = action === 0 ? unfollowInterval : followInterval; // 根据动作选择不同的间隔时间

        timeoutId = setTimeout(() => toggleFollowState(nextAction), delay);  // 在指定的时间后切换状态
    }

    function followOrUnfollow(action) {
        try {
            let button;
            if (action === 0) {  // 取消关注
                const dropdown = document.querySelector('.be-dropdown.h-f-btn.h-unfollow');
                if (dropdown) {
                    const dropdownMenu = dropdown.querySelector('.be-dropdown-menu');
                    if (dropdownMenu && dropdownMenu.style.display === 'none') {
                        dropdownMenu.style.display = 'block';  // 显示菜单
                    }

                    button = Array.from(dropdownMenu.querySelectorAll('.be-dropdown-item'))
                        .find(item => item.textContent.trim() === '取消关注');
                }
            } else {  // 关注
                button = document.querySelector(".h-f-btn.h-follow");
            }

            if (button && button.offsetParent !== null) {  // 确保按钮可见
                button.click();
                logMessage(`已${action === 0 ? '取消关注' : '关注'}一个UP主`);
            } else {
                showErrorMessage(`未找到${action === 1 ? '' : '取消'}关注按钮`);
            }
        } catch (error) {
            showErrorMessage("执行关注/取消关注时出错: " + error.message);
        }
    }

    function logMessage(message) {
        const logContainer = document.getElementById('logContainer');
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;  // 滚动到底部
    }

    function showErrorMessage(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
            setTimeout(() => {
                errorMessage.textContent = '';
            }, 3000);
        }
    }

    const { toggleButton, statusText, errorMessage, logContainer } = createPanel();
})();
