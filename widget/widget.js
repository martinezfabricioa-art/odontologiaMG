/**
 * Odontologia MG AgentKit â€” Widget de Chat Embebible
 *
 * Uso:
 *   <script src="https://tu-backend.railway.app/widget/widget.js"></script>
 *
 * ConfiguraciÃ³n opcional (antes del script):
 *   <script>
 *     window.AgentKitConfig = {
 *       apiUrl: "https://tu-backend.railway.app",  // requerido si no estÃ¡ embebido
 *       title: "Odontologia MG",
 *       subtitle: "Â¿En quÃ© te puedo ayudar?",
 *       primaryColor: "#2563eb",
 *       position: "right"  // "right" o "left"
 *     };
 *   </script>
 */

(function () {
  "use strict";

  // â”€â”€ ConfiguraciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var config = window.AgentKitConfig || {};
  var API_URL = (config.apiUrl || "http://localhost:8000").replace(/\/$/, "");
  var TITLE = config.title || "Odontologia MG";
  var SUBTITLE = config.subtitle || "Â¿En quÃ© te puedo ayudar? ðŸ¦·";
  var PRIMARY = config.primaryColor || "#1d4ed8";
  var POSITION = config.position === "left" ? "left" : "right";

  // â”€â”€ Session ID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function getSessionId() {
    var key = "agentkit_session_id";
    var id = localStorage.getItem(key);
    if (!id) {
      id = "web-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(key, id);
    }
    return id;
  }

  var sessionId = getSessionId();

  // â”€â”€ Estilos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var css = `
    #agentkit-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

    #agentkit-btn {
      position: fixed;
      bottom: 24px;
      ${POSITION}: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${PRIMARY};
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      z-index: 9998;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #agentkit-btn:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }

    #agentkit-panel {
      position: fixed;
      bottom: 92px;
      ${POSITION}: 16px;
      width: 360px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      opacity: 0;
      transform: translateY(16px) scale(0.97);
      pointer-events: none;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    #agentkit-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    #agentkit-header {
      background: ${PRIMARY};
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    #agentkit-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    #agentkit-header-info { flex: 1; min-width: 0; }
    #agentkit-header-title { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #agentkit-header-sub { font-size: 12px; opacity: 0.85; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #agentkit-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      font-size: 20px;
      padding: 4px;
      line-height: 1;
      flex-shrink: 0;
      transition: color 0.15s;
    }
    #agentkit-close:hover { color: #fff; }

    #agentkit-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f8fafc;
      scroll-behavior: smooth;
    }
    #agentkit-messages::-webkit-scrollbar { width: 4px; }
    #agentkit-messages::-webkit-scrollbar-track { background: transparent; }
    #agentkit-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

    .ak-msg {
      max-width: 82%;
      padding: 9px 13px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .ak-msg.user {
      align-self: flex-end;
      background: ${PRIMARY};
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .ak-msg.assistant {
      align-self: flex-start;
      background: #fff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .ak-typing {
      align-self: flex-start;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      padding: 10px 14px;
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .ak-typing span {
      width: 7px;
      height: 7px;
      background: #94a3b8;
      border-radius: 50%;
      animation: ak-bounce 1.2s infinite ease-in-out;
    }
    .ak-typing span:nth-child(2) { animation-delay: 0.2s; }
    .ak-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ak-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }

    #agentkit-footer {
      padding: 10px 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      background: #fff;
      flex-shrink: 0;
    }
    #agentkit-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 14px;
      color: #1e293b;
      resize: none;
      outline: none;
      line-height: 1.45;
      max-height: 100px;
      overflow-y: auto;
      transition: border-color 0.15s;
    }
    #agentkit-input:focus { border-color: ${PRIMARY}; }
    #agentkit-input::placeholder { color: #94a3b8; }
    #agentkit-send {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: ${PRIMARY};
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, opacity 0.15s;
    }
    #agentkit-send:hover { opacity: 0.88; }
    #agentkit-send:disabled { opacity: 0.45; cursor: not-allowed; }
    #agentkit-send svg { width: 18px; height: 18px; }

    #agentkit-powered {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      padding: 4px 0 8px;
      background: #fff;
    }

    .ak-msg.assistant a {
      display: inline-block;
      padding: 8px 14px;
      margin-top: 8px;
      background: #25D366;
      color: #fff !important;
      border-radius: 6px;
      text-decoration: none !important;
      font-weight: 500;
      font-size: 13px;
      transition: opacity 0.2s;
    }
    .ak-msg.assistant a:hover {
      opacity: 0.88;
    }

    .btn-cancelar, .btn-reservar {
      display: inline-block;
      padding: 8px 14px;
      margin-top: 8px;
      background: #ef4444;
      color: #fff !important;
      border: none;
      border-radius: 6px;
      text-decoration: none !important;
      font-weight: 500;
      font-size: 13px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-cancelar:hover:not(:disabled), .btn-reservar:hover:not(:disabled) {
      opacity: 0.88;
    }
    .btn-cancelar:disabled, .btn-reservar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

  // â”€â”€ Inyectar CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // â”€â”€ HTML del widget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var wrapper = document.createElement("div");
  wrapper.id = "agentkit-widget";
  wrapper.innerHTML = `
    <button id="agentkit-btn" aria-label="Abrir chat">ðŸ’¬</button>

    <div id="agentkit-panel" role="dialog" aria-label="Chat de asistencia" aria-hidden="true">
      <div id="agentkit-header">
        <div id="agentkit-header-avatar">ðŸ¦·</div>
        <div id="agentkit-header-info">
          <div id="agentkit-header-title">${TITLE}</div>
          <div id="agentkit-header-sub">${SUBTITLE}</div>
        </div>
        <button id="agentkit-close" aria-label="Cerrar chat">âœ•</button>
      </div>

      <div id="agentkit-messages" role="log" aria-live="polite"></div>

      <div id="agentkit-footer">
        <textarea
          id="agentkit-input"
          placeholder="EscribÃ­ tu consulta..."
          rows="1"
          aria-label="Mensaje"
          maxlength="1000"
        ></textarea>
        <button id="agentkit-send" aria-label="Enviar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div id="agentkit-powered">Powered by Azuu Soluciones Web</div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // â”€â”€ Referencias DOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var btn = document.getElementById("agentkit-btn");
  var panel = document.getElementById("agentkit-panel");
  var messages = document.getElementById("agentkit-messages");
  var input = document.getElementById("agentkit-input");
  var sendBtn = document.getElementById("agentkit-send");
  var closeBtn = document.getElementById("agentkit-close");

  // â”€â”€ Estado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var isOpen = false;
  var isLoading = false;
  var greeted = false;

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(role, text) {
    var div = document.createElement("div");
    div.className = "ak-msg " + role;

    if (role === "assistant") {
      // Detectar marcador de bÃºsqueda de turnos [BUSCAR_TURNOS_WIDGET:X]
      var buscarTurnosMatch = text.match(/\[BUSCAR_TURNOS_WIDGET:(\d+)\]/);
      // Detectar marcador de ver mis turnos [VER_MIS_TURNOS_WIDGET]
      var verMisTurnosMatch = text.match(/\[VER_MIS_TURNOS_WIDGET\]/);

      if (buscarTurnosMatch) {
        var idProfesional = parseInt(buscarTurnosMatch[1]);
        // Remover el marcador del texto
        text = text.replace(/\[BUSCAR_TURNOS_WIDGET:\d+\]/, "").trim();
        // Procesar HTML
        div.innerHTML = text;
        // Buscar turnos y agregar al mensaje
        buscarYMostrarTurnos(div, idProfesional);
      } else if (verMisTurnosMatch) {
        // Remover el marcador del texto
        text = text.replace(/\[VER_MIS_TURNOS_WIDGET\]/, "").trim();
        // Procesar HTML
        div.innerHTML = text;
        // Buscar mis turnos y agregar al mensaje
        verMisTurnosAutomatico(div);
      } else {
        // Procesar HTML tags (especialmente <a> tags)
        div.innerHTML = text;
      }

      // Hacer links seguros (noopener, noreferrer)
      var links = div.querySelectorAll("a");
      links.forEach(function(link) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      });
    } else {
      div.textContent = text;
    }

    messages.appendChild(div);
    scrollBottom();
    return div;
  }

  function buscarYMostrarTurnos(messageDiv, idProfesional) {
    // Mostrar spinner mientras se buscan turnos
    var spinnerDiv = document.createElement("div");
    spinnerDiv.style.marginTop = "8px";
    spinnerDiv.style.fontSize = "13px";
    spinnerDiv.style.color = "#94a3b8";
    spinnerDiv.textContent = "â³ Cargando turnos disponibles...";
    messageDiv.appendChild(spinnerDiv);

    // Hacer la llamada para obtener los turnos
    fetch(API_URL + "/turnos/buscar-html/" + idProfesional)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        spinnerDiv.remove();
        if (data.html) {
          var turnosDiv = document.createElement("div");
          turnosDiv.style.marginTop = "8px";
          turnosDiv.style.padding = "10px";
          turnosDiv.style.backgroundColor = "#f0fdf4";
          turnosDiv.style.borderRadius = "6px";
          turnosDiv.style.borderLeft = "4px solid #22c55e";
          turnosDiv.innerHTML = data.html;
          messageDiv.appendChild(turnosDiv);

          // Agregar manejadores de eventos para botones de reservar
          setTimeout(function() {
            var reservarBtns = turnosDiv.querySelectorAll(".btn-reservar");
            reservarBtns.forEach(function(btn) {
              btn.addEventListener("click", function(e) {
                e.preventDefault();
                var idTurno = btn.getAttribute("data-id");
                reservarTurnoAutomatico(idTurno, btn);
              });
            });
          }, 100);
        }
        scrollBottom();
      })
      .catch(function(error) {
        spinnerDiv.textContent = "âŒ Error al cargar turnos: " + error.message;
        scrollBottom();
      });
  }

  function reservarTurnoAutomatico(idTurno, btnElement) {
    if (!idTurno) return;

    // Extraer DNI del historial de mensajes
    var dniMatch = null;
    var allMsgs = messages.querySelectorAll(".ak-msg.user");
    allMsgs.forEach(function(msg) {
      var match = msg.textContent.match(/\b(\d{7,8})\b/);
      if (match && !dniMatch) {
        dniMatch = match[1];
      }
    });

    if (!dniMatch) {
      alert("âŒ No encontrÃ© tu DNI. Por favor, proporciona tu DNI en la conversaciÃ³n.");
      return;
    }

    if (!confirm("Â¿EstÃ¡s seguro de que querÃ©s reservar este turno?")) {
      return;
    }

    var originalText = btnElement.textContent;
    btnElement.textContent = "â³ Reservando...";
    btnElement.disabled = true;

    // Extraer fecha y hora del turno desde el texto del span anterior
    var turnoItem = btnElement.closest(".turno-item");
    var turnoText = turnoItem ? turnoItem.querySelector("span").textContent : "";
    // turnoText format: "Viernes 17/11/2025 - 14:00 hs"
    var dateMatch = turnoText.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}):(\d{2})/);
    var turnoData = null;
    if (dateMatch) {
      turnoData = {
        fecha: turnoText.split(" - ")[0].trim(),
        hora: dateMatch[4] + ":" + dateMatch[5],
        fechaISO: dateMatch[3] + dateMatch[2] + dateMatch[1] + "T" + dateMatch[4] + dateMatch[5]
      };
    }

    fetch(API_URL + "/turnos/reservar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni: dniMatch, id_turno: parseInt(idTurno) })
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.status === "success") {
          btnElement.textContent = "âœ… Reservado";
          btnElement.style.backgroundColor = "#22c55e";

          // Agregar botÃ³n de agendar recordatorio si tenemos los datos
          if (turnoData) {
            var calendarLink = "https://www.google.com/calendar/render?action=TEMPLATE" +
              "&text=Turno Odontologia MG" +
              "&dates=" + turnoData.fechaISO + "/" + turnoData.fechaISO +
              "&details=Turno reservado en Odontologia MG%0ARecuerda presentar comprobante de seÃ±a";

            var calendarBtn = document.createElement("a");
            calendarBtn.href = calendarLink;
            calendarBtn.target = "_blank";
            calendarBtn.style.display = "inline-block";
            calendarBtn.style.marginTop = "8px";
            calendarBtn.style.marginLeft = "8px";
            calendarBtn.style.padding = "8px 14px";
            calendarBtn.style.backgroundColor = "#7c3aed";
            calendarBtn.style.color = "white";
            calendarBtn.style.borderRadius = "6px";
            calendarBtn.style.textDecoration = "none";
            calendarBtn.style.fontWeight = "500";
            calendarBtn.style.fontSize = "13px";
            calendarBtn.textContent = "ðŸ“… Agendar recordatorio";
            btnElement.parentNode.insertBefore(calendarBtn, btnElement.nextSibling);
          }

          // Agregar nota sobre seÃ±a con importe
          var noteDiv = document.createElement("div");
          noteDiv.style.marginTop = "12px";
          noteDiv.style.padding = "12px";
          noteDiv.style.backgroundColor = "#fef3c7";
          noteDiv.style.borderRadius = "6px";
          noteDiv.style.borderLeft = "4px solid #f59e0b";
          noteDiv.style.fontSize = "13px";
          noteDiv.style.color = "#92400e";
          noteDiv.innerHTML = "<strong>ðŸ’° SEÃ‘A REQUERIDA:</strong><br>" +
            "Importe: <strong>$20.000</strong><br>" +
            "Por favor, envÃ­a el comprobante de pago por WhatsApp para confirmar tu turno:<br>" +
            "<a href='https://wa.me/5492996037282?text=Comprobante%20de%20pago%20de%20seÃ±a' style='display:inline-block;padding:8px 14px;background:#25D366;color:white;border-radius:6px;text-decoration:none;margin-top:8px;font-weight:500;font-size:12px;'>ðŸ“± Enviar comprobante por WhatsApp</a>";
          btnElement.closest(".turno-item").parentNode.insertBefore(noteDiv, btnElement.closest(".turno-item").nextSibling);
        } else {
          btnElement.textContent = "âŒ Error: " + data.message;
          btnElement.style.backgroundColor = "#ef4444";
        }
        scrollBottom();
      })
      .catch(function(error) {
        btnElement.textContent = "âŒ Error: " + error.message;
        btnElement.style.backgroundColor = "#ef4444";
        scrollBottom();
      });
  }

  function verMisTurnosAutomatico(messageDiv) {
    // Extraer DNI del historial de mensajes
    var dniMatch = null;
    var allMsgs = messages.querySelectorAll(".ak-msg.user");
    allMsgs.forEach(function(msg) {
      // Buscar nÃºmero de 8 dÃ­gitos (DNI argentino tÃ­pico)
      var match = msg.textContent.match(/\b(\d{7,8})\b/);
      if (match && !dniMatch) {
        dniMatch = match[1];
      }
    });

    if (!dniMatch) {
      var errorDiv = document.createElement("div");
      errorDiv.style.marginTop = "8px";
      errorDiv.style.padding = "10px";
      errorDiv.style.backgroundColor = "#fef2f2";
      errorDiv.style.borderRadius = "6px";
      errorDiv.style.borderLeft = "4px solid #ef4444";
      errorDiv.style.fontSize = "13px";
      errorDiv.textContent = "âŒ No encontrÃ© tu DNI en la conversaciÃ³n. Por favor, proporciona tu DNI.";
      messageDiv.appendChild(errorDiv);
      return;
    }

    // Mostrar spinner
    var spinnerDiv = document.createElement("div");
    spinnerDiv.style.marginTop = "8px";
    spinnerDiv.style.fontSize = "13px";
    spinnerDiv.style.color = "#94a3b8";
    spinnerDiv.textContent = "â³ Buscando tus turnos...";
    messageDiv.appendChild(spinnerDiv);

    // Llamada para obtener mis turnos
    fetch(API_URL + "/turnos/mis-turnos?dni=" + dniMatch)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        spinnerDiv.remove();
        if (data.data) {
          var turnosDiv = document.createElement("div");
          turnosDiv.style.marginTop = "8px";
          turnosDiv.style.padding = "10px";
          turnosDiv.style.backgroundColor = "#f0fdf4";
          turnosDiv.style.borderRadius = "6px";
          turnosDiv.style.borderLeft = "4px solid #22c55e";
          turnosDiv.innerHTML = "<strong>ðŸ“… Tus turnos:</strong><br>" + data.data;
          messageDiv.appendChild(turnosDiv);

          // Agregar manejadores de eventos para botones de cancelar
          setTimeout(function() {
            var cancelBtns = turnosDiv.querySelectorAll(".btn-cancelar");
            cancelBtns.forEach(function(btn) {
              btn.addEventListener("click", function(e) {
                e.preventDefault();
                var idTurno = btn.getAttribute("data-id");
                cancelarTurnoAutomatico(idTurno, btn);
              });
            });
          }, 100);
        }
        scrollBottom();
      })
      .catch(function(error) {
        spinnerDiv.textContent = "âŒ Error al cargar tus turnos: " + error.message;
        scrollBottom();
      });
  }

  function cancelarTurnoAutomatico(idTurno, btnElement) {
    if (!idTurno) return;

    if (!confirm("Â¿EstÃ¡s seguro de que querÃ©s cancelar este turno?")) {
      return;
    }

    var originalText = btnElement.textContent;
    btnElement.textContent = "â³ Cancelando...";
    btnElement.disabled = true;

    fetch(API_URL + "/turnos/cancelar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_turno: parseInt(idTurno) })
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.status === "success") {
          btnElement.textContent = "âœ… Cancelado";
          btnElement.style.backgroundColor = "#22c55e";
        } else {
          btnElement.textContent = "âŒ Error: " + data.message;
          btnElement.style.backgroundColor = "#ef4444";
        }
        scrollBottom();
      })
      .catch(function(error) {
        btnElement.textContent = "âŒ Error: " + error.message;
        btnElement.style.backgroundColor = "#ef4444";
        scrollBottom();
      });
  }

  function showTyping() {
    var el = document.createElement("div");
    el.className = "ak-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    el.id = "ak-typing-indicator";
    messages.appendChild(el);
    scrollBottom();
  }

  function hideTyping() {
    var el = document.getElementById("ak-typing-indicator");
    if (el) el.remove();
  }

  function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  }

  function attachMenuListeners() {
    setTimeout(function() {
      var allAssistantMsgs = messages.querySelectorAll(".ak-msg.assistant");
      if (allAssistantMsgs.length === 0) return;

      var lastMsg = allAssistantMsgs[allAssistantMsgs.length - 1];
      var divs = lastMsg.querySelectorAll("div");

      var menuOptions = {
        "A- SOLICITAR UN TURNO": "A",
        "B- CONSULTAR OBRA SOCIAL": "B",
        "C- CONSULTAR VALORES": "C",
        "D- SERVICIOS DISPONIBLES": "D",
        "F- OTRAS CONSULTAS": "F"
      };

      divs.forEach(function(div) {
        var text = div.textContent.trim();
        if (menuOptions[text]) {
          div.style.cursor = "pointer";
          div.addEventListener("click", function(e) {
            e.stopPropagation();
            input.value = menuOptions[text];
            sendMessage();
          });
        }
      });
    }, 50);
  }

  // â”€â”€ Abrir / cerrar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    btn.innerHTML = "âœ•";
    input.focus();

    if (!greeted) {
      greeted = true;
      addMessage("assistant", "Â¡Hola! ðŸ‘‹ Soy Marian, la asistente virtual de Odontologia MG. Â¿En quÃ© te puedo ayudar hoy?\n\n<div style='display:inline-block;padding:10px 16px;background:#1d4ed8;color:white;border-radius:6px;margin-top:8px;margin-right:8px;cursor:pointer;'>A- SOLICITAR UN TURNO</div>\n<div style='display:inline-block;padding:10px 16px;background:#1d4ed8;color:white;border-radius:6px;margin-top:8px;margin-right:8px;cursor:pointer;'>B- CONSULTAR OBRA SOCIAL</div>\n<div style='display:inline-block;padding:10px 16px;background:#1d4ed8;color:white;border-radius:6px;margin-top:8px;margin-right:8px;cursor:pointer;'>C- CONSULTAR VALORES</div>\n<div style='display:inline-block;padding:10px 16px;background:#1d4ed8;color:white;border-radius:6px;margin-top:8px;margin-right:8px;cursor:pointer;'>D- SERVICIOS DISPONIBLES</div>\n<div style='display:inline-block;padding:10px 16px;background:#1d4ed8;color:white;border-radius:6px;margin-top:8px;cursor:pointer;'>F- OTRAS CONSULTAS</div>");
      attachMenuListeners();
    }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    btn.innerHTML = "ðŸ’¬";
  }

  btn.addEventListener("click", function () {
    isOpen ? closePanel() : openPanel();
  });

  closeBtn.addEventListener("click", closePanel);

  // â”€â”€ Enviar mensaje â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function sendMessage() {
    var text = input.value.trim();
    if (!text || isLoading) return;

    isLoading = true;
    sendBtn.disabled = true;
    input.value = "";
    input.style.height = "auto";

    addMessage("user", text);
    showTyping();

    try {
      var res = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text })
      });

      hideTyping();

      if (!res.ok) {
        addMessage("assistant", "Lo siento, hubo un error al conectarme. IntentÃ¡ de nuevo ðŸ™");
      } else {
        var data = await res.json();
        addMessage("assistant", data.response);
      }
    } catch (err) {
      hideTyping();
      addMessage("assistant", "No pude conectarme al servidor. VerificÃ¡ tu conexiÃ³n e intentÃ¡ de nuevo.");
    }

    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }

  sendBtn.addEventListener("click", sendMessage);

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener("input", autoResize);

  // â”€â”€ Cerrar con Escape â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) closePanel();
  });

})();

