// ==UserScript==
// @name         Custom Bilibili Auto Follow/Unfollow
// @namespace    https://github.com/IGCrystal/Custom-Bilibili-Auto-Follow-Unfollow/
// @version      5.7
// @description  A script to automatically follow/unfollow on Bilibili with enhanced UI and controls.
// @author       Larch4, IGCrystal
// @match        https://space.bilibili.com/*
// @grant        none
// @license      GNU Affero General Public License v3.0
// @downloadURL https://update.greasyfork.org/scripts/512572/Custom%20Bilibili%20Auto%20FollowUnfollow.user.js
// @updateURL https://update.greasyfork.org/scripts/512572/Custom%20Bilibili%20Auto%20FollowUnfollow.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const FOLLOW_INTERVAL_DEFAULT = 2000; // 关注时间间隔（默认2秒）
    const UNFOLLOW_INTERVAL_DEFAULT = 2000; // 取消关注时间间隔（默认2秒）

    let isRunning = false;
    let useRandomInterval = true; // 是否使用随机间隔
    let followUnfollowTimeout = null; // 关注/取消关注的定时器
    let modalCheckInterval = null; // 弹窗检查的定时器
    let captchaModalInterval = null; //
    /* let modalCheckIntervalIfNeeded = null; //验证码弹窗检查定时器 */
    let followInterval = FOLLOW_INTERVAL_DEFAULT;
    let unfollowInterval = UNFOLLOW_INTERVAL_DEFAULT;
    const MAX_LOGS = 10; // 日志最大数量为10条
    const logQueue = []; // 存储日志的数组

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'bilibili-auto-follow-panel';
        panel.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background-color: #fff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            color: #333; padding: 15px; border-radius: 10px; z-index: 2147483647;
            display: flex; flex-direction: column; align-items: stretch; width: 240px;
            font-family: Arial, sans-serif; transition: max-height 0.3s ease, opacity 0.3s ease;
            overflow: hidden; max-height: 400px;
            opacity: 1;
        `;

        panel.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; text-align: center; color: #00a1d6;">
                Bilibili 自动关注脚本
                <button id="foldButton" style="
                    background-color: #00a1d6; color: #fff; border: none; padding: 6px 10px;
                    border-radius: 6px; cursor: pointer; font-size: 14px; transition: background-color 0.3s; align-self: center; margin-bottom: 0px; margin-left: 20px;">展开</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <button id="toggleButton" style="
                    flex: 1; background-color: #00a1d6; color: #fff; border: none; padding: 8px 12px;
                    border-radius: 6px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;
                ">开始</button>
                <span id="statusText" style="flex: 1; margin-left: 105px; font-size: 14px; color: #666;">未运行</span>
            </div>
            <div id="additionalContent" style="max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.5s ease, opacity 0.5s ease;">
                <div style="margin-bottom: 10px; display: flex; flex-direction: column;">
                    <label>关注间隔（秒）：</label>
                    <input id="followIntervalInput" type="number" min="1" value="${FOLLOW_INTERVAL_DEFAULT / 1000}" style="
                        width: 95%; padding: 5px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 10px; display: flex; flex-direction: column;">
                    <label>取消关注间隔（秒）：</label>
                    <input id="unfollowIntervalInput" type="number" min="1" value="${UNFOLLOW_INTERVAL_DEFAULT / 1000}" style="
                        width: 95%; padding: 5px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input id="useRandomInterval" type="checkbox" checked style="margin-right: 9px;">
                    <label for="useRandomInterval" style="font-size: 14px; color: #333; cursor: pointer;">
                        使用随机时间间隔
                    </label>
                </div>
                <div id="logContainer" style="
                    max-height: 120px; overflow-y: auto; border: 1px solid #ddd; padding: 5px; margin-top: 10px; border-radius: 4px;
                    font-size: 12px; color: #333; background-color: #f9f9f9;"></div>
            </div>
            <div id="errorMessage" style="color: red; font-size: 12px; margin-top: 10px;"></div>
        `;

        document.body.appendChild(panel);
        makePanelDraggable(panel);

        const toggleButton = panel.querySelector('#toggleButton');
        toggleButton.addEventListener('click', toggleScript);

        const foldButton = panel.querySelector('#foldButton');
        const additionalContent = panel.querySelector('#additionalContent');
        let isFolded = true;

        foldButton.addEventListener('click', () => {
            if (isFolded) {
                additionalContent.style.maxHeight = '400px';
                additionalContent.style.opacity = '1';
                foldButton.textContent = '收缩';
            } else {
                additionalContent.style.maxHeight = '0';
                additionalContent.style.opacity = '0';
                foldButton.textContent = '展开';
            }
            isFolded = !isFolded;
        });

        document.getElementById('toggleButton').addEventListener('click', toggleScript);
        document.getElementById('useRandomInterval').addEventListener('change', toggleRandomInterval);

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
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SPAN' || e.target.tagName === 'INPUT') return;

            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            e.preventDefault();

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (isDragging) {
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
                panel.style.left = `${e.clientX - offsetX}px`;
                panel.style.top = `${e.clientY - offsetY}px`;
            }
        }

        function onMouseUp() {
            if (isDragging) {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
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
        toggleFollowState(1);
        modalCheckInterval = setInterval(removeModal, 1000);
        captchaModalInterval = setInterval(geetest, 1000);
        /* modalCheckIntervalIfNeeded = setInterval(removeAllModalsIfNeeded, 1000); */
        updateUI('暂停', '#f25d8e', '运行中');
    }

    function stopAutoFollowUnfollow() {
        clearTimeout(followUnfollowTimeout);
        clearInterval(modalCheckInterval);
        clearInterval(captchaModalInterval);
        /* clearInterval(modalCheckIntervalIfNeeded); */
        updateUI('开始', '#00a1d6', '未运行');
    }

    function removeModal() {
        const modals = document.querySelectorAll('.modal-container, .be-toast');
        modals.forEach(modal => modal.remove()); // 移除所有匹配的面板
    }

/*    function removeAllModalsIfNeeded() {
        const modals = document.querySelectorAll('.geetest_panel, .geetest_wind'); // 选择验证码的容器
        modals.forEach(modal => modal.remove()); // 移除所有匹配的验证码面板
    }
*/

    function geetest() {
        const captchaModal = document.querySelector('.geetest_panel, .geetest_wind');
        const myPanel = document.getElementById('bilibili-auto-follow-panel');
        if (captchaModal && myPanel) {
            captchaModal.style.zIndex = '-2147483648'; // 保持验证码在你的面板之下
            myPanel.style.zIndex = '2147483647'; // 保证你的面板在最上层
        }
    }

    function toggleRandomInterval() {
        useRandomInterval = document.getElementById('useRandomInterval').checked;
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
        const nextAction = action === 0 ? 1 : 0;
        const delay = getInterval(action === 0 ? unfollowInterval : followInterval);

        followUnfollowTimeout = setTimeout(() => toggleFollowState(nextAction) , delay);

    }

    function followOrUnfollow(action) {
        try {
            let button;
            if (action === 0) {
                const dropdown = document.querySelector('.be-dropdown.h-f-btn.h-unfollow');
                if (dropdown) {
                    const dropdownMenu = dropdown.querySelector('.be-dropdown-menu');
                    if (dropdownMenu && dropdownMenu.style.display === 'none') {
                        dropdownMenu.style.display = 'block';
                    }

                    button = dropdownMenu ? Array.from(dropdownMenu.querySelectorAll('.be-dropdown-item'))
                        .find(item => item.textContent.trim() === '取消关注') : null;
                }
            } else {
                button = document.querySelector(".h-f-btn.h-follow");
            }

            if (button && button.offsetParent !== null) {
                button.click();
                logMessage(`已${action === 0 ? '取消关注' : '关注'}一个UP主`);
            } else {
                showErrorMessage(`未找到${action === 1 ? '' : '取消'}关注按钮`);
            }
        } catch (error) {
            showErrorMessage("执行关注/取消关注时出错: " + error.message);
        }
    }

    function getInterval(baseInterval) {
        let interval = useRandomInterval ? baseInterval + Math.random() * 1000 : baseInterval;
        console.log(`当前间隔时间: ${interval} 毫秒`);
        return interval;
    }

    function logMessage(message) {
        const logContainer = document.getElementById('logContainer');
        const logEntry = document.createElement('div');
        logEntry.textContent = message;

        if (logQueue.length >= MAX_LOGS) {
            logQueue.shift(); // 移除最早的日志，保持日志数量为10条
            logContainer.removeChild(logContainer.firstChild); // 删除页面中的最早日志
        }
        logQueue.push(message); // 添加日志到队列

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight; // 滚动到最底部

        // 同时限制控制台日志数量
        console.clear(); // 每次清空控制台
        logQueue.forEach(log => console.log(log)); // 重新输出最新的日志
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

    createPanel();
})();

    createPanel();
})();
