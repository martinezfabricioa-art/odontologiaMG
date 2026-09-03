<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');
/**
 * Sistema de Gestión de Turnos - API Endpoint
 * Desarrollado para PHP 7+ y llamadas Ajax.
 */

// 1. Seguridad: Solo permitir peticiones POST (evita acceso directo por URL)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(["status" => "error", "message" => "Acceso no permitido."]);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// 2. Conexión a la Base de Datos (Ajustá los datos de tu servidor)
$host = 'localhost';
$db   = 'c2380824_odonto';
$user = 'c2380824_odonto';
$pass = 'zeka41ZIke';
$charset = 'utf8mb4';



$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error de conexión: " . $e->getMessage()]);
    exit;
}

// 3. Recepción y sanitización de parámetros (Compatibles con $.ajax de jQuery)
$funcion       = isset($_POST['funcion']) ? (int)$_POST['funcion'] : 0;
$dni           = isset($_POST['dni']) ? trim($_POST['dni']) : null;
$idProfesional = isset($_POST['idProfesional']) ? (int)$_POST['idProfesional'] : null;
$idTurno       = isset($_POST['idTurno']) ? (int)$_POST['idTurno'] : null;

// 4. Router de Funciones
switch ($funcion) {

    case 1: // -----------------------------------------------------------------
            // BUSCAR TURNOS LIBRES POR PROFESIONAL
            // -----------------------------------------------------------------
        if (!$idProfesional) {
            echo json_encode(["status" => "error", "message" => "Falta el ID del Profesional."]);
            exit;
        }

        try {
            $sql = "SELECT t.id, 
                           DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha, 
                           DATE_FORMAT(fecha, '%W') AS dia, 
                           DATE_FORMAT(hora, '%H:%i') AS hora
                    FROM turno t
                    WHERE t.idProfesional = :idProfesional 
                      AND t.idEstado = 4 
                      AND t.fecha > NOW() 
                    LIMIT 10";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['idProfesional' => $idProfesional]);
            $turnos = $stmt->fetchAll();

            $html = "";
            if (empty($turnos)) {
                $html = "<p class='alert alert-warning'>No hay turnos disponibles.</p>";
            } else {
                // CORREGIDO: Se agregó "as $row" para que no rompa la ejecución
                foreach ($turnos as $row) {
                    $html .= "<div class='turno-item'>";
                    $html .= "<span>{$row['dia']} {$row['fecha']} - {$row['hora']} hs</span>";
                    $html .= "<button type='button' class='btn-reservar' data-id='{$row['id']}'>Reservar Turno</button>";
                    $html .= "</div>";
                }
            }

            echo json_encode(["status" => "success", "data" => $html]);
        } catch (\PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 2: // -----------------------------------------------------------------
            // VER MIS TURNOS RESERVADOS POR DNI
            // -----------------------------------------------------------------
        if (empty($dni)) {
            echo json_encode(["status" => "error", "message" => "Falta el DNI del Paciente."]);
            exit;
        }

        try {
            // Primero obtenemos el idPaciente usando el DNI de forma segura
            $sqlPaciente = "SELECT id FROM paciente WHERE dni = :dni LIMIT 1";
            $stmtPac = $pdo->prepare($sqlPaciente);
            $stmtPac->execute(['dni' => $dni]);
            $paciente = $stmtPac->fetch();

            if (!$paciente) {
                echo json_encode(["status" => "success", "data" => "<p>Paciente no registrado.</p>"]);
                exit;
            }

            $sql = "SELECT t.id, 
                           DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha, 
                           DATE_FORMAT(fecha, '%W') AS dia, 
                           DATE_FORMAT(hora, '%H:%i') AS hora
                    FROM turno t
                    WHERE t.idPaciente = :idPaciente 
                      AND t.fecha > NOW()";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['idPaciente' => $paciente['id']]);
            $misTurnos = $stmt->fetchAll();

            // Renderizamos la respuesta con el botón para la función 4 (Cancelar)
            $html = "";
            if (empty($misTurnos)) {
                $html = "<p>No tenés turnos reservados.</p>";
            } else {
                foreach ($misTurnos as $row) {
                    $html .= "<div class='turno-reservado'>";
                    $html .= "<span>{$row['dia']} {$row['fecha']} - {$row['hora']} hs</span>";
                    // Botón que gatilla la función 4 vía Ajax pasando el ID del turno
                    $html .= "<button type='button' class='btn-cancelar' data-id='{$row['id']}'>Cancelar Turno</button>";
                    $html .= "</div>";
                }
            }

            echo json_encode(["status" => "success", "data" => $html]);
        } catch (\PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 3: // -----------------------------------------------------------------
            // RESERVAR TURNO (Y GENERAR LINK DE CALENDAR)
            // -----------------------------------------------------------------
        if (empty($dni) || !$idTurno) {
            echo json_encode(["status" => "error", "message" => "Parámetros insuficientes para reservar."]);
            exit;
        }

        try {
            // Transacción simple para asegurar consistencia
            $sql = "UPDATE turno SET 
                        idEstado = 1, 
                        idPaciente = (SELECT id FROM paciente WHERE dni = :dni),
                        origen = 'AGENTE', 
						nota = 'SIN CONFIRMAR',
                        fechaAlta = NOW() 
                    WHERE idEstado = 4 
                      AND id = :idTurno";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'dni'     => $dni,
                'idTurno' => $idTurno
            ]);

            if ($stmt->rowCount() > 0) {
                // CORREGIDO: Usamos alias explícitos en la query para mapear el array asociativo sin fallas
                $sqlInfo = "SELECT DATE_FORMAT(fecha, '%Y%m%d') AS fecha_cal, 
                                   DATE_FORMAT(hora, '%H%i%s') AS hora_cal 
                            FROM turno 
                            WHERE id = :idTurno LIMIT 1";
                $stmtInfo = $pdo->prepare($sqlInfo);
                $stmtInfo->execute(['idTurno' => $idTurno]);
                $tData = $stmtInfo->fetch();

                // Armamos el formato requerido por Google: YYYYMMDDTHHMMSS
                $start = $tData['fecha_cal'] . 'T' . $tData['hora_cal'];
                
                $calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE"
                    . "&text=" . urlencode("Turno Médico")
                    . "&dates=" . $start . "/" . $start
                    . "&details=" . urlencode("Turno confirmado desde el asistente web.");

                $btnCalendar = "<a href='{$calendarUrl}' target='_blank' class='btn-calendar'>📅 Agregar a Google Calendar</a>";

                echo json_encode([
                    "status" => "success", 
                    "message" => "Turno reservado con éxito.",
                    "calendar_btn" => $btnCalendar
                ]);
            } else {
                echo json_encode(["status" => "error", "message" => "El turno ya no está disponible o ya fue tomado."]);
            }
        } catch (\PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 4: // -----------------------------------------------------------------
            // CANCELAR TURNO
            // -----------------------------------------------------------------
        if (!$idTurno) {
            echo json_encode(["status" => "error", "message" => "Falta el ID del turno para cancelar."]);
            exit;
        }

        try {
            $sql = "UPDATE turno SET 
                        idEstado = 4, 
                        idPaciente = 0,
                        origen = 'AGENTE', 
                        fechaAlta = NOW() 
                    WHERE idEstado = 1 
                      AND id = :idTurno";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['idTurno' => $idTurno]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["status" => "success", "message" => "Turno cancelado correctamente."]);
            } else {
                echo json_encode(["status" => "error", "message" => "No se pudo cancelar el turno o ya estaba libre."]);
            }
        } catch (\PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Función no válida."]);
        break;
}