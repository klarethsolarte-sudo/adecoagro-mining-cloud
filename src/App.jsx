import React, { useEffect, useState } from "react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { configured, supabase } from "./supabase";

const ADMIN = "klarethsolarte@gmail.com";
const LOGO = "/adeco-energia.jpg.jpg";
const TOTAL_MINERS = 1280;
const PHOTO_BUCKET = "profile-photos";
const MAX_PHOTO_SIZE = 3 * 1024 * 1024;

const translations = {
  "pt-BR": {
    "login": "Entrar com Google",
    "or": "OU",
    "email": "E-mail",
    "password": "Senha",
    "show": "Mostrar",
    "hide": "Ocultar",
    "loginEmail": "Entrar com e-mail e senha",
    "forgotPassword": "Esqueceu sua senha?",
    "googleRegistration": "O cadastro inicial dos usuários é realizado pelo Google. Após acessar, você poderá definir uma senha em Meu perfil.",
    "emailPlaceholder": "Digite seu e-mail",
    "passwordPlaceholder": "Digite sua senha",
    "wait": "Aguarde...",
    "entering": "Entrando...",
    "loadingProfile": "Carregando perfil...",
    "newPassword": "Nova senha",
    "confirmPassword": "Confirmar senha",
    "updatePassword": "Atualizar senha",
    "savePassword": "Salvar senha",
    "updating": "Atualizando...",
    "mandatoryPassword": "É necessário definir uma nova senha para continuar.",
    "temporaryPasswordInfo": "O administrador definiu uma senha temporária. Crie sua própria senha para continuar.",
    "passwordContinue": "Defina uma senha com pelo menos 8 caracteres.",
    "logout": "Sair",
    "blocked": "Acesso bloqueado",
    "pendingStatus": "Cadastro pendente",
    "waiting": "Aguarde a aprovação do administrador.",
    "contactAdmin": "Entre em contato com o administrador.",
    "home": "Início",
    "history": "Histórico geral",
    "admin": "Administração de usuários",
    "profile": "Meu perfil",
    "title": "Relatório diário operacional",
    "date": "Data operacional",
    "shift": "Turno de trabalho",
    "operator": "Operador(es)",
    "rest": "Folga / descanso",
    "restPerson": "Nome da pessoa",
    "hash": "Hashrate (PH/s)",
    "online": "Mineradoras em operação (Un.)",
    "offline": "Mineradoras offline (Un.)",
    "availability": "Disponibilidade (%)",
    "power": "Consumo de energia (MW)",
    "month": "Consumo mensal (kWh)",
    "generators": "Geradores em operação",
    "events": "Ocorrências",
    "maintenance": "Manutenção realizada",
    "pending": "Pendências para o próximo turno",
    "guidance": "Orientações da supervisão",
    "save": "Salvar relatório",
    "cancelEdit": "Cancelar edição",
    "selectShift": "Selecione o turno",
    "select": "Selecionar",
    "shiftA": "Turno A — 07:00 às 15:20",
    "shiftB": "Turno B — 15:20 às 23:20",
    "shiftC": "Turno C — 23:20 às 07:00",
    "noRest": "Sem descanso",
    "dayOff": "Folga",
    "medicalLeave": "Atestado",
    "timeBank": "Banco de horas",
    "absence": "Falta",
    "noReports": "Nenhum relatório encontrado.",
    "edit": "Editar",
    "delete": "Excluir",
    "shareReport": "Compartilhar relatório",
    "scanQR": "Ler código QR",
    "shareWhatsApp": "Compartilhar no WhatsApp",
    "close": "Fechar",
    "operationalInfo": "INFORMAÇÕES OPERACIONAIS",
    "shiftDetails": "DETALHES DO TURNO",
    "workShift": "TURNO DE TRABALHO",
    "operators": "OPERADORES",
    "restLabel": "DESCANSO",
    "availabilityLabel": "DISPONIBILIDADE (%)",
    "onlineLabel": "MINERADORAS ONLINE",
    "offlineLabel": "MINERADORAS OFFLINE",
    "powerLabel": "CONSUMO (MW)",
    "monthLabel": "CONSUMO MENSAL (kWh)",
    "generatorsLabel": "GERADORES EM OPERAÇÃO",
    "incidentsLabel": "OCORRÊNCIAS",
    "maintenanceLabel": "MANUTENÇÃO REALIZADA",
    "pendingLabel": "PENDÊNCIAS DO PRÓXIMO TURNO",
    "guidanceLabel": "ORIENTAÇÕES DA SUPERVISÃO",
    "reportSubtitle": "RELATÓRIO DIÁRIO OPERACIONAL",
    "dateLabel": "DATA",
    "shiftLabel": "TURNO",
    "shiftWord": "Turno",
    "noRestLabel": "Sem descanso",
    "mainAdmin": "Administrador principal",
    "accountLimit": "Limite planejado: 1 administrador + 9 operadores.",
    "approve": "Aprovar",
    "block": "Bloquear",
    "assignTempPassword": "Definir senha temporária",
    "tempPasswordLabel": "Senha temporária",
    "tempPasswordPlaceholder": "Digite a senha temporária",
    "confirmTempPassword": "Confirmar senha temporária",
    "assigning": "Atribuindo...",
    "cancel": "Cancelar",
    "tempPasswordInfo": "A senha temporária será solicitada ao operador no próximo acesso.",
    "passwordChangePending": "Alteração de senha pendente",
    "accountStatus": "Status da conta",
    "accountType": "Tipo de conta",
    "changePhoto": "Alterar foto",
    "uploadingPhoto": "Enviando foto...",
    "profileName": "Nome do perfil",
    "namePlaceholder": "Digite seu nome",
    "currentEmail": "E-mail atual",
    "saveChanges": "Salvar alterações",
    "saving": "Salvando...",
    "changeEmail": "Alterar e-mail",
    "emailVerificationInfo": "Será enviado um e-mail de confirmação para concluir a alteração.",
    "newEmail": "Novo e-mail",
    "newEmailPlaceholder": "Digite o novo e-mail",
    "send": "Enviar",
    "requestEmailChange": "Solicitar alteração de e-mail",
    "passwordSection": "Senha",
    "passwordInfo": "Você pode definir ou alterar sua senha de acesso.",
    "minPassword": "Mínimo de 8 caracteres",
    "repeatPassword": "Repita a senha",
    "updatePasswordButton": "Atualizar senha",
    "accountInfo": "Informações da conta",
    "lastAccess": "Último acesso",
    "unavailable": "Não disponível",
    "currentStatus": "Status atual",
    "filterDate": "Filtrar por data",
    "filterShift": "Filtrar por turno",
    "filterOperator": "Buscar operador",
    "allShifts": "Todos os turnos",
    "allDates": "Todas as datas",
    "clearFilters": "Limpar filtros",
    "results": "Relatórios encontrados",
    "dashboard": "Indicadores operacionais",
    "latestReport": "Dados do relatório mais recente",
    "noDashboardData": "Ainda não há relatórios para mostrar os indicadores.",
    "minersOnline": "Mineradoras online",
    "minersOffline": "Mineradoras offline",
    "activeGenerators": "Geradores ativos",
    "electricity": "Consumo elétrico",
    "enterEmailPassword": "Informe seu e-mail e senha.",
    "enterAccountEmail": "Informe o e-mail da sua conta.",
    "invalidEmail": "E-mail inválido.",
    "passwordMin": "A senha deve ter pelo menos 8 caracteres.",
    "passwordMismatch": "As senhas não coincidem.",
    "passwordUpdated": "Senha atualizada com sucesso.",
    "emailSent": "Se a conta existir, você receberá um link de recuperação.",
    "emailChangeSent": "Enviamos um e-mail para confirmar a alteração.",
    "photoInvalid": "Selecione um arquivo de imagem válido.",
    "photoTooLarge": "A foto deve ter no máximo 3 MB.",
    "loginRequired": "É necessário entrar na conta.",
    "photoUpdated": "Foto atualizada.",
    "nameRequired": "Informe seu nome.",
    "profileUpdated": "Perfil atualizado.",
    "selectWorkShift": "Selecione o turno de trabalho.",
    "selectOperationalDate": "Informe a data operacional.",
    "minersLimit": "O total de mineradoras online e offline não pode ultrapassar 1280.",
    "minersNegative": "A quantidade de mineradoras não pode ser negativa.",
    "generatorsLimit": "O número de geradores deve estar entre 0 e 3.",
    "restPersonRequired": "Informe o nome da pessoa relacionada ao descanso/ausência.",
    "reportSaved": "Relatório salvo com sucesso.",
    "noEditPermission": "Você não tem permissão para editar este relatório.",
    "noDeletePermission": "Você não tem permissão para excluir este relatório.",
    "noPasswordPermission": "Você não tem permissão para alterar esta senha.",
    "tempPasswordMin": "A senha temporária deve ter pelo menos 8 caracteres.",
    "tempPasswordMax": "A senha temporária deve ter no máximo 72 caracteres.",
    "confirmTempAssignment": "Deseja definir esta senha temporária para o operador?",
    "tempPasswordAssigned": "Senha temporária atribuída.",
    "confirmDelete": "Tem certeza de que deseja excluir este relatório?",
    "reportDeleted": "Relatório excluído com sucesso.",
    "deleteFailed": "Não foi possível excluir o relatório.",
    "qrError": "Erro ao gerar o código QR.",
    "pdfError": "Não foi possível gerar o PDF.",
    "jpgError": "Não foi possível gerar o JPG.",
    "reportNotFound": "Relatório não encontrado.",
    "emailError": "Erro ao alterar o e-mail.",
    "passwordError": "Erro ao atualizar a senha.",
    "profileError": "Erro ao salvar o perfil.",
    "photoError": "Erro ao enviar a foto.",
    "photoSaveError": "Erro ao salvar a foto.",
    "tempPasswordError": "Erro ao definir a senha temporária.",
    "functionError": "Erro na função administrativa.",
    "communicationError": "Erro de comunicação.",
    "statusUpdated": "Status atualizado.",
    "noDeleteResult": "Nenhum relatório para excluir.",
    "passwordAuthorizationError": "Não foi possível autorizar a alteração da senha.",
    "supabaseMissing": "As credenciais do Supabase não foram configuradas.",
    "supabaseSetup": "Configure a URL e a chave pública do Supabase. Nunca use a chave service_role no navegador.",
    "noAbsence": "Sem ausência",
    "footer": "ADECOAGRO · ENERGIA EM CRESCIMENTO",
    "createNewPassword": "Criar nova senha",
    "newPasswordIntro": "Digite uma nova senha para sua conta.",
    "mandatoryPasswordTitle": "Atualização obrigatória de senha",
    "mandatoryPasswordText": "O administrador atribuiu uma senha temporária à sua conta. Para continuar, crie uma nova senha pessoal.",
    "changePasswordContinue": "Alterar senha e continuar",
    "profilePhotoAlt": "Foto do perfil",
    "mainAdminPrefix": "Administrador principal:",
    "limitPrefix": "Limite planejado:",
    "passwordPending": "Alteração de senha pendente",
    "tempPasswordMinLabel": "Senha temporária (mínimo de 12 caracteres)",
    "operatorMustChange": "O operador deverá criar sua própria senha antes de voltar a usar o sistema.",
    "changeEmailHeading": "Alterar e-mail",
    "changeEmailDescription": "O Supabase enviará um link para verificar o novo e-mail.",
    "passwordDescription": "Defina uma senha para entrar com e-mail além do Google, ou altere sua senha atual.",
    "confirmNewPassword": "Confirmar nova senha",
    "qrScanInstruction": "Escaneie para abrir este relatório.",
    "sending": "Enviando..."
  },
  "es-419": {
    "login": "Entrar con Google",
    "or": "O",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "show": "Mostrar",
    "hide": "Ocultar",
    "loginEmail": "Entrar con correo y contraseña",
    "forgotPassword": "¿Olvidaste tu contraseña?",
    "googleRegistration": "El registro inicial de usuarios se realiza mediante Google. Después de acceder, podrás establecer una contraseña desde Mi perfil.",
    "emailPlaceholder": "Escribe tu correo electrónico",
    "passwordPlaceholder": "Escribe tu contraseña",
    "wait": "Espera...",
    "entering": "Entrando...",
    "loadingProfile": "Cargando perfil...",
    "newPassword": "Nueva contraseña",
    "confirmPassword": "Confirmar contraseña",
    "updatePassword": "Actualizar contraseña",
    "savePassword": "Guardar contraseña",
    "updating": "Actualizando...",
    "mandatoryPassword": "Debes establecer una nueva contraseña para continuar.",
    "temporaryPasswordInfo": "El administrador asignó una contraseña temporal. Crea tu propia contraseña para continuar.",
    "passwordContinue": "Define una contraseña de al menos 8 caracteres.",
    "logout": "Salir",
    "blocked": "Acceso bloqueado",
    "pendingStatus": "Registro pendiente",
    "waiting": "Espera la aprobación del administrador.",
    "contactAdmin": "Comunícate con el administrador.",
    "home": "Inicio",
    "history": "Historial general",
    "admin": "Administración de usuarios",
    "profile": "Mi perfil",
    "title": "Informe diario operacional",
    "date": "Fecha operacional",
    "shift": "Turno de trabajo",
    "operator": "Operador(es)",
    "rest": "Descanso / ausencia",
    "restPerson": "Nombre de la persona",
    "hash": "Hashrate (PH/s)",
    "online": "Mineradoras en operación (Un.)",
    "offline": "Mineradoras fuera de línea (Un.)",
    "availability": "Disponibilidad (%)",
    "power": "Consumo de energía (MW)",
    "month": "Consumo mensual (kWh)",
    "generators": "Generadores en operación",
    "events": "Incidencias",
    "maintenance": "Mantenimiento realizado",
    "pending": "Pendientes para el próximo turno",
    "guidance": "Orientaciones de supervisión",
    "save": "Guardar informe",
    "cancelEdit": "Cancelar edición",
    "selectShift": "Seleccionar turno",
    "select": "Seleccionar",
    "shiftA": "Turno A — 07:00 a 15:20",
    "shiftB": "Turno B — 15:20 a 23:20",
    "shiftC": "Turno C — 23:20 a 07:00",
    "noRest": "Sin descanso",
    "dayOff": "Descanso",
    "medicalLeave": "Certificado médico",
    "timeBank": "Banco de horas",
    "absence": "Ausencia",
    "noReports": "No se encontraron informes.",
    "edit": "Editar",
    "delete": "Eliminar",
    "shareReport": "Compartir informe",
    "scanQR": "Leer código QR",
    "shareWhatsApp": "Compartir por WhatsApp",
    "close": "Cerrar",
    "operationalInfo": "INFORMACIÓN OPERACIONAL",
    "shiftDetails": "DETALLES DEL TURNO",
    "workShift": "TURNO DE TRABAJO",
    "operators": "OPERADORES",
    "restLabel": "DESCANSO",
    "availabilityLabel": "DISPONIBILIDAD (%)",
    "onlineLabel": "MINERADORAS EN LÍNEA",
    "offlineLabel": "MINERADORAS FUERA DE LÍNEA",
    "powerLabel": "CONSUMO (MW)",
    "monthLabel": "CONSUMO MENSUAL (kWh)",
    "generatorsLabel": "GENERADORES EN OPERACIÓN",
    "incidentsLabel": "INCIDENCIAS",
    "maintenanceLabel": "MANTENIMIENTO REALIZADO",
    "pendingLabel": "PENDIENTES DEL PRÓXIMO TURNO",
    "guidanceLabel": "ORIENTACIONES DE SUPERVISIÓN",
    "reportSubtitle": "INFORME DIARIO OPERACIONAL",
    "dateLabel": "FECHA",
    "shiftLabel": "TURNO",
    "shiftWord": "Turno",
    "noRestLabel": "Sin descanso",
    "mainAdmin": "Administrador principal",
    "accountLimit": "Límite previsto: 1 administrador + 9 operadores.",
    "approve": "Aprobar",
    "block": "Bloquear",
    "assignTempPassword": "Asignar contraseña temporal",
    "tempPasswordLabel": "Contraseña temporal",
    "tempPasswordPlaceholder": "Escribe la contraseña temporal",
    "confirmTempPassword": "Confirmar contraseña temporal",
    "assigning": "Asignando...",
    "cancel": "Cancelar",
    "tempPasswordInfo": "El operador deberá cambiar la contraseña temporal en su próximo acceso.",
    "passwordChangePending": "Cambio de contraseña pendiente",
    "accountStatus": "Estado de la cuenta",
    "accountType": "Tipo de cuenta",
    "changePhoto": "Cambiar foto",
    "uploadingPhoto": "Subiendo foto...",
    "profileName": "Nombre del perfil",
    "namePlaceholder": "Escribe tu nombre",
    "currentEmail": "Correo actual",
    "saveChanges": "Guardar cambios",
    "saving": "Guardando...",
    "changeEmail": "Cambiar correo",
    "emailVerificationInfo": "Se enviará un correo de confirmación para completar el cambio.",
    "newEmail": "Nuevo correo",
    "newEmailPlaceholder": "Escribe el nuevo correo",
    "send": "Enviar",
    "requestEmailChange": "Solicitar cambio de correo",
    "passwordSection": "Contraseña",
    "passwordInfo": "Puedes establecer o cambiar tu contraseña de acceso.",
    "minPassword": "Mínimo 8 caracteres",
    "repeatPassword": "Repite la contraseña",
    "updatePasswordButton": "Actualizar contraseña",
    "accountInfo": "Información de la cuenta",
    "lastAccess": "Último acceso",
    "unavailable": "No disponible",
    "currentStatus": "Estado actual",
    "filterDate": "Filtrar por fecha",
    "filterShift": "Filtrar por turno",
    "filterOperator": "Buscar operador",
    "allShifts": "Todos los turnos",
    "allDates": "Todas las fechas",
    "clearFilters": "Limpiar filtros",
    "results": "Informes encontrados",
    "dashboard": "Indicadores operacionales",
    "latestReport": "Datos del informe más reciente",
    "noDashboardData": "Todavía no hay informes para mostrar indicadores.",
    "minersOnline": "Mineradoras en línea",
    "minersOffline": "Mineradoras fuera de línea",
    "activeGenerators": "Generadores activos",
    "electricity": "Consumo eléctrico",
    "enterEmailPassword": "Ingresa tu correo y contraseña.",
    "enterAccountEmail": "Ingresa el correo de tu cuenta.",
    "invalidEmail": "Correo electrónico no válido.",
    "passwordMin": "La contraseña debe tener al menos 8 caracteres.",
    "passwordMismatch": "Las contraseñas no coinciden.",
    "passwordUpdated": "Contraseña actualizada correctamente.",
    "emailSent": "Si la cuenta existe, recibirás un enlace de recuperación.",
    "emailChangeSent": "Enviamos un correo para confirmar el cambio.",
    "photoInvalid": "Selecciona un archivo de imagen válido.",
    "photoTooLarge": "La foto debe pesar como máximo 3 MB.",
    "loginRequired": "Debes iniciar sesión.",
    "photoUpdated": "Foto actualizada.",
    "nameRequired": "Ingresa tu nombre.",
    "profileUpdated": "Perfil actualizado.",
    "selectWorkShift": "Selecciona el turno de trabajo.",
    "selectOperationalDate": "Ingresa la fecha operacional.",
    "minersLimit": "El total de mineradoras en línea y fuera de línea no puede superar 1280.",
    "minersNegative": "La cantidad de mineradoras no puede ser negativa.",
    "generatorsLimit": "La cantidad de generadores debe estar entre 0 y 3.",
    "restPersonRequired": "Ingresa el nombre de la persona relacionada con el descanso/ausencia.",
    "reportSaved": "Informe guardado correctamente.",
    "noEditPermission": "No tienes permiso para editar este informe.",
    "noDeletePermission": "No tienes permiso para eliminar este informe.",
    "noPasswordPermission": "No tienes permiso para cambiar esta contraseña.",
    "tempPasswordMin": "La contraseña temporal debe tener al menos 8 caracteres.",
    "tempPasswordMax": "La contraseña temporal debe tener como máximo 72 caracteres.",
    "confirmTempAssignment": "¿Deseas asignar esta contraseña temporal al operador?",
    "tempPasswordAssigned": "Contraseña temporal asignada.",
    "confirmDelete": "¿Seguro que deseas eliminar este informe?",
    "reportDeleted": "Informe eliminado correctamente.",
    "deleteFailed": "No se pudo eliminar el informe.",
    "qrError": "Error al generar el código QR.",
    "pdfError": "No se pudo generar el PDF.",
    "jpgError": "No se pudo generar el JPG.",
    "reportNotFound": "No se encontró el informe.",
    "emailError": "Error al cambiar el correo.",
    "passwordError": "Error al actualizar la contraseña.",
    "profileError": "Error al guardar el perfil.",
    "photoError": "Error al subir la foto.",
    "photoSaveError": "Error al guardar la foto.",
    "tempPasswordError": "Error al asignar la contraseña temporal.",
    "functionError": "Error en la función administrativa.",
    "communicationError": "Error de comunicación.",
    "statusUpdated": "Estado actualizado.",
    "noDeleteResult": "No hay informes para eliminar.",
    "passwordAuthorizationError": "No se pudo autorizar el cambio de contraseña.",
    "supabaseMissing": "No se configuraron las credenciales de Supabase.",
    "supabaseSetup": "Configura la URL y la clave pública de Supabase. Nunca uses la clave service_role en el navegador.",
    "noAbsence": "Sin ausencia",
    "footer": "ADECOAGRO · ENERGÍA EN CRECIMIENTO",
    "createNewPassword": "Crear nueva contraseña",
    "newPasswordIntro": "Ingresa una nueva contraseña para tu cuenta.",
    "mandatoryPasswordTitle": "Actualización obligatoria de contraseña",
    "mandatoryPasswordText": "El administrador asignó una contraseña temporal a tu cuenta. Para continuar, crea una nueva contraseña personal.",
    "changePasswordContinue": "Cambiar contraseña y continuar",
    "profilePhotoAlt": "Foto de perfil",
    "mainAdminPrefix": "Administrador principal:",
    "limitPrefix": "Límite previsto:",
    "passwordPending": "Cambio de contraseña pendiente",
    "tempPasswordMinLabel": "Contraseña temporal (mínimo 12 caracteres)",
    "operatorMustChange": "El operador deberá crear su propia contraseña antes de volver a utilizar el sistema.",
    "changeEmailHeading": "Cambiar correo electrónico",
    "changeEmailDescription": "Supabase enviará un enlace para verificar el nuevo correo.",
    "passwordDescription": "Establece una contraseña para entrar con correo además de Google, o cambia tu contraseña actual.",
    "confirmNewPassword": "Confirmar nueva contraseña",
    "qrScanInstruction": "Escanea para abrir este informe.",
    "sending": "Enviando..."
  },
  "en-US": {
    "login": "Sign in with Google",
    "or": "OR",
    "email": "Email address",
    "password": "Password",
    "show": "Show",
    "hide": "Hide",
    "loginEmail": "Sign in with email and password",
    "forgotPassword": "Forgot your password?",
    "googleRegistration": "Initial user registration is done through Google. After signing in, you can set a password in My Profile.",
    "emailPlaceholder": "Enter your email",
    "passwordPlaceholder": "Enter your password",
    "wait": "Please wait...",
    "entering": "Signing in...",
    "loadingProfile": "Loading profile...",
    "newPassword": "New password",
    "confirmPassword": "Confirm password",
    "updatePassword": "Update password",
    "savePassword": "Save password",
    "updating": "Updating...",
    "mandatoryPassword": "You must set a new password to continue.",
    "temporaryPasswordInfo": "The administrator assigned a temporary password. Create your own password to continue.",
    "passwordContinue": "Set a password with at least 8 characters.",
    "logout": "Sign out",
    "blocked": "Access blocked",
    "pendingStatus": "Registration pending",
    "waiting": "Wait for administrator approval.",
    "contactAdmin": "Contact the administrator.",
    "home": "Home",
    "history": "General history",
    "admin": "User administration",
    "profile": "My profile",
    "title": "Daily operational report",
    "date": "Operational date",
    "shift": "Work shift",
    "operator": "Operator(s)",
    "rest": "Day off / absence",
    "restPerson": "Person's name",
    "hash": "Hashrate (PH/s)",
    "online": "Miners operating (Units)",
    "offline": "Miners offline (Units)",
    "availability": "Availability (%)",
    "power": "Power consumption (MW)",
    "month": "Monthly consumption (kWh)",
    "generators": "Generators operating",
    "events": "Occurrences",
    "maintenance": "Maintenance performed",
    "pending": "Pending for next shift",
    "guidance": "Supervisor instructions",
    "save": "Save report",
    "cancelEdit": "Cancel editing",
    "selectShift": "Select shift",
    "select": "Select",
    "shiftA": "Shift A — 07:00 to 15:20",
    "shiftB": "Shift B — 15:20 to 23:20",
    "shiftC": "Shift C — 23:20 to 07:00",
    "noRest": "No absence",
    "dayOff": "Day off",
    "medicalLeave": "Medical leave",
    "timeBank": "Time bank",
    "absence": "Absence",
    "noReports": "No reports found.",
    "edit": "Edit",
    "delete": "Delete",
    "shareReport": "Share report",
    "scanQR": "Scan QR code",
    "shareWhatsApp": "Share on WhatsApp",
    "close": "Close",
    "operationalInfo": "OPERATIONAL INFORMATION",
    "shiftDetails": "SHIFT DETAILS",
    "workShift": "WORK SHIFT",
    "operators": "OPERATORS",
    "restLabel": "DAY OFF",
    "availabilityLabel": "AVAILABILITY (%)",
    "onlineLabel": "MINERS ONLINE",
    "offlineLabel": "MINERS OFFLINE",
    "powerLabel": "POWER CONSUMPTION (MW)",
    "monthLabel": "MONTHLY CONSUMPTION (kWh)",
    "generatorsLabel": "GENERATORS OPERATING",
    "incidentsLabel": "OCCURRENCES",
    "maintenanceLabel": "MAINTENANCE PERFORMED",
    "pendingLabel": "NEXT SHIFT PENDING ITEMS",
    "guidanceLabel": "SUPERVISOR INSTRUCTIONS",
    "reportSubtitle": "DAILY OPERATIONAL REPORT",
    "dateLabel": "DATE",
    "shiftLabel": "SHIFT",
    "shiftWord": "Shift",
    "noRestLabel": "No absence",
    "mainAdmin": "Main administrator",
    "accountLimit": "Planned limit: 1 administrator + 9 operators.",
    "approve": "Approve",
    "block": "Block",
    "assignTempPassword": "Set temporary password",
    "tempPasswordLabel": "Temporary password",
    "tempPasswordPlaceholder": "Enter temporary password",
    "confirmTempPassword": "Confirm temporary password",
    "assigning": "Assigning...",
    "cancel": "Cancel",
    "tempPasswordInfo": "The operator will be asked to change the temporary password at next sign-in.",
    "passwordChangePending": "Password change pending",
    "accountStatus": "Account status",
    "accountType": "Account type",
    "changePhoto": "Change photo",
    "uploadingPhoto": "Uploading photo...",
    "profileName": "Profile name",
    "namePlaceholder": "Enter your name",
    "currentEmail": "Current email",
    "saveChanges": "Save changes",
    "saving": "Saving...",
    "changeEmail": "Change email",
    "emailVerificationInfo": "A confirmation email will be sent to complete the change.",
    "newEmail": "New email",
    "newEmailPlaceholder": "Enter new email",
    "send": "Send",
    "requestEmailChange": "Request email change",
    "passwordSection": "Password",
    "passwordInfo": "You can set or change your sign-in password.",
    "minPassword": "At least 8 characters",
    "repeatPassword": "Repeat password",
    "updatePasswordButton": "Update password",
    "accountInfo": "Account information",
    "lastAccess": "Last access",
    "unavailable": "Unavailable",
    "currentStatus": "Current status",
    "filterDate": "Filter by date",
    "filterShift": "Filter by shift",
    "filterOperator": "Search operator",
    "allShifts": "All shifts",
    "allDates": "All dates",
    "clearFilters": "Clear filters",
    "results": "Reports found",
    "dashboard": "Operational indicators",
    "latestReport": "Latest report data",
    "noDashboardData": "There are no reports yet to display indicators.",
    "minersOnline": "Miners online",
    "minersOffline": "Miners offline",
    "activeGenerators": "Active generators",
    "electricity": "Electricity consumption",
    "enterEmailPassword": "Enter your email and password.",
    "enterAccountEmail": "Enter your account email.",
    "invalidEmail": "Invalid email address.",
    "passwordMin": "Password must contain at least 8 characters.",
    "passwordMismatch": "Passwords do not match.",
    "passwordUpdated": "Password updated successfully.",
    "emailSent": "If the account exists, you will receive a recovery link.",
    "emailChangeSent": "We sent an email to confirm the change.",
    "photoInvalid": "Select a valid image file.",
    "photoTooLarge": "The photo must be no larger than 3 MB.",
    "loginRequired": "You must sign in.",
    "photoUpdated": "Photo updated.",
    "nameRequired": "Enter your name.",
    "profileUpdated": "Profile updated.",
    "selectWorkShift": "Select the work shift.",
    "selectOperationalDate": "Enter the operational date.",
    "minersLimit": "Online and offline miners cannot exceed 1280 in total.",
    "minersNegative": "Miner count cannot be negative.",
    "generatorsLimit": "The number of generators must be between 0 and 3.",
    "restPersonRequired": "Enter the name of the person related to the absence.",
    "reportSaved": "Report saved successfully.",
    "noEditPermission": "You do not have permission to edit this report.",
    "noDeletePermission": "You do not have permission to delete this report.",
    "noPasswordPermission": "You do not have permission to change this password.",
    "tempPasswordMin": "Temporary password must contain at least 8 characters.",
    "tempPasswordMax": "Temporary password must be no longer than 72 characters.",
    "confirmTempAssignment": "Do you want to set this temporary password for the operator?",
    "tempPasswordAssigned": "Temporary password assigned.",
    "confirmDelete": "Are you sure you want to delete this report?",
    "reportDeleted": "Report deleted successfully.",
    "deleteFailed": "Could not delete the report.",
    "qrError": "Error generating QR code.",
    "pdfError": "Could not generate PDF.",
    "jpgError": "Could not generate JPG.",
    "reportNotFound": "Report not found.",
    "emailError": "Error changing email.",
    "passwordError": "Error updating password.",
    "profileError": "Error saving profile.",
    "photoError": "Error uploading photo.",
    "photoSaveError": "Error saving photo.",
    "tempPasswordError": "Error setting temporary password.",
    "functionError": "Administrative function error.",
    "communicationError": "Communication error.",
    "statusUpdated": "Status updated.",
    "noDeleteResult": "No reports to delete.",
    "passwordAuthorizationError": "Could not authorize password change.",
    "supabaseMissing": "Supabase credentials are not configured.",
    "supabaseSetup": "Configure the Supabase URL and public key. Never use the service_role key in the browser.",
    "noAbsence": "No absence",
    "footer": "ADECOAGRO · ENERGY IN GROWTH",
    "createNewPassword": "Create new password",
    "newPasswordIntro": "Enter a new password for your account.",
    "mandatoryPasswordTitle": "Password update required",
    "mandatoryPasswordText": "The administrator assigned a temporary password to your account. Create a new personal password to continue.",
    "changePasswordContinue": "Change password and continue",
    "profilePhotoAlt": "Profile photo",
    "mainAdminPrefix": "Main administrator:",
    "limitPrefix": "Planned limit:",
    "passwordPending": "Password change pending",
    "tempPasswordMinLabel": "Temporary password (minimum 12 characters)",
    "operatorMustChange": "The operator must create their own password before using the system again.",
    "changeEmailHeading": "Change email address",
    "changeEmailDescription": "Supabase will send a link to verify the new email address.",
    "passwordDescription": "Set a password to sign in with email in addition to Google, or change your current password.",
    "confirmNewPassword": "Confirm new password",
    "qrScanInstruction": "Scan to open this report.",
    "sending": "Sending..."
  }
};

function getLocalDate(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getOperationalInfo(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();

  let work_shift;
  const operationalDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (minutes >= 420 && minutes < 920) {
    work_shift = "A";
  } else if (minutes >= 920 && minutes < 1400) {
    work_shift = "B";
  } else {
    work_shift = "C";

    if (minutes < 420) {
      operationalDate.setDate(operationalDate.getDate() - 1);
    }
  }

  return {
    report_date: getLocalDate(operationalDate),
    work_shift
  };
}

function createBlankForm() {
  return {
    ...getOperationalInfo(),
    operator_names: "",
    rest_type: "none",
    rest_person: "",
    hashrate: "",
    miners_online: "",
    miners_offline: "",
    availability: "",
    power_mw: "",
    monthly_kwh: "",
    generators_online: "",
    incidents: "",
    maintenance: "",
    next_shift_pending: "",
    supervisor_guidance: ""
  };
}

const fields = [
  "report_date",
  "work_shift",
  "operator_names",
  "rest_type",
  "rest_person",
  "hashrate",
  "miners_online",
  "miners_offline",
  "availability",
  "power_mw",
  "monthly_kwh",
  "generators_online",
  "incidents",
  "maintenance",
  "next_shift_pending",
  "supervisor_guidance"
];

const reportStyles = {
  container: {
    background: "#ffffff",
    color: "#182923",
    border: "1px solid #cbd8ce",
    borderRadius: "12px",
    padding: "18px",
    width: "100%",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    borderBottom: "3px solid #1c6040",
    paddingBottom: "14px",
    marginBottom: "14px",
    textAlign: "center",
    flexWrap: "wrap"
  },
  logo: {
    width: "95px",
    height: "75px",
    objectFit: "contain"
  },
  brand: {
    color: "#164d35",
    fontSize: "19px",
    fontWeight: "bold",
    margin: "0 0 5px"
  },
  subtitle: {
    color: "#607268",
    fontSize: "11px",
    letterSpacing: "1px",
    margin: 0
  },
  sectionTitle: {
    background: "#164d35",
    color: "#ffffff",
    padding: "9px 12px",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: "bold",
    margin: "16px 0 9px",
    letterSpacing: "0.4px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "9px"
  },
  cell: {
    border: "1px solid #b9cbbd",
    borderRadius: "6px",
    padding: "10px",
    minWidth: 0,
    background: "#fbfdfb",
    boxSizing: "border-box"
  },
  cellLabel: {
    display: "block",
    color: "#26704b",
    fontSize: "10px",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: "7px"
  },
  cellValue: {
    display: "block",
    color: "#182923",
    fontSize: "14px",
    fontWeight: "600",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
    minHeight: "18px"
  },
  footer: {
    borderTop: "1px solid #cbd8ce",
    marginTop: "16px",
    paddingTop: "10px",
    color: "#718078",
    fontSize: "10px",
    textAlign: "center"
  }
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [lang, setLang] = useState(
    localStorage.getItem("amc-lang") || "pt-BR"
  );

  const [form, setForm] = useState(createBlankForm);
  const [reports, setReports] = useState([]);
  const [historyDate, setHistoryDate] = useState("");
  const [historyShift, setHistoryShift] = useState("");
  const [historyOperator, setHistoryOperator] = useState("");
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");

  const [qrReport, setQrReport] = useState(null);
  const [qrImage, setQrImage] = useState("");

  const [activeSection, setActiveSection] = useState("home");
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Autenticación por correo y contraseña
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Recuperación y establecimiento de contraseña
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Cambio de correo
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Fotografía de perfil
  const [photoLoading, setPhotoLoading] = useState(false);

  // Administración de contraseñas temporales
  const [temporaryPasswordUser, setTemporaryPasswordUser] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [temporaryPasswordLoading, setTemporaryPasswordLoading] = useState(false);

  const t = translations[lang] || translations["pt-BR"];

  const availability = form.miners_online === ""
    ? "0.00"
    : (
        (Number(form.miners_online) / TOTAL_MINERS) * 100
      ).toFixed(2);

  const isAdmin =
    session?.user?.email?.toLowerCase() === ADMIN;

  const userName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    "Usuario";

  const profilePhoto =
    profile?.avatar_url ||
    session?.user?.user_metadata?.avatar_url ||
    session?.user?.user_metadata?.picture ||
    "";

  const mustChangePassword =
    Boolean(profile?.must_change_password);

  const latestReport = reports[0] || null;
  const filteredReports = reports.filter(report => {
    const matchesDate = !historyDate || report.report_date === historyDate;
    const matchesShift = !historyShift || report.work_shift === historyShift;
    const matchesOperator = !historyOperator ||
      String(report.operators || "").toLowerCase().includes(historyOperator.toLowerCase());
    return matchesDate && matchesShift && matchesOperator;
  });

  useEffect(() => {
    if (!configured) return;

    const hash = new URLSearchParams(
      window.location.hash.replace(/^#/, "")
    );

    if (hash.get("type") === "recovery") {
      setRecoveryMode(true);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setNotice(error.message);
        return;
      }

      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadProfile();
    } else {
      setProfile(null);
      setReports([]);
      setUsers([]);
    }
  }, [session]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("report")) {
      setActiveSection("history");
    }
  }, []);

  async function loadProfile() {
    const currentSession = session;

    if (!currentSession?.user?.id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentSession.user.id)
      .maybeSingle();

    if (error) {
      setNotice(error.message);
      return;
    }

    setProfile(data);

    setProfileName(
      data?.full_name ||
      currentSession.user.user_metadata?.full_name ||
      currentSession.user.user_metadata?.name ||
      ""
    );

    if (
      data?.status === "approved" &&
      !data?.must_change_password
    ) {
      await loadReports();

      if (
        currentSession.user.email?.toLowerCase() === ADMIN
      ) {
        await loadUsers();
      }
    }
  }

  async function loadReports() {
    const sharedId = new URLSearchParams(
      window.location.search
    ).get("report");

    let query = supabase.from("daily_reports").select("*");

    if (sharedId) {
      query = query.eq("id", sharedId);
    }

    const { data, error } = await query
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setNotice(error.message);
    } else {
      setReports(data || []);
    }
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,status,created_at,must_change_password")
      .order("created_at");

    if (error) {
      setNotice(error.message);
    } else {
      setUsers(data || []);
    }
  }

  // Acceso con Google
  async function signInGoogle() {
    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      setNotice(error.message);
      setAuthLoading(false);
    }
  }

  // Acceso con correo y contraseña
  async function signInEmail(e) {
    e.preventDefault();

    if (!authEmail.trim() || !authPassword) {
      setNotice(t.enterEmailPassword);
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword
    });

    setAuthLoading(false);

    if (error) {
      setNotice(`${t.communicationError} ${error.message}`);
      return;
    }

    setAuthPassword("");
  }

  // Registro inicial: se mantiene exclusivamente con Google.
  // La contraseña se establece posteriormente en el mismo usuario.

  // Recuperar contraseña por correo
  async function recoverPassword() {
    const email = authEmail.trim();

    if (!email) {
      setNotice(t.enterAccountEmail);
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: window.location.origin
      }
    );

    setAuthLoading(false);

    if (error) {
      setNotice(`${t.emailError} ${error.message}`);
      return;
    }

    setNotice(
      "Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña."
    );
  }

  // Establecer o cambiar contraseña propia
  async function updateOwnPassword(e) {
    e?.preventDefault();

    if (newPassword.length < 8) {
      setNotice(t.passwordMin);
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice(t.passwordMismatch);
      return;
    }

    setPasswordLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordLoading(false);
      setNotice(`${t.passwordError} ${error.message}`);
      return;
    }

    // Si la contraseña era temporal, se libera la cuenta
    // solamente después de cambiarla correctamente.
    if (mustChangePassword) {
      const { error: rpcError } = await supabase.rpc(
        "complete_password_change"
      );

      if (rpcError) {
        setPasswordLoading(false);
        setNotice(
          "La contraseña cambió, pero no se pudo completar la autorización: " +
          rpcError.message
        );
        return;
      }
    }

    setNewPassword("");
    setConfirmPassword("");
    setRecoveryMode(false);
    setPasswordLoading(false);

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    setNotice(t.passwordUpdated);

    await loadProfile();
  }

  // Cambio de correo: Supabase enviará la verificación
  async function changeOwnEmail(e) {
    e.preventDefault();

    const email = newEmail.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      setNotice(t.invalidEmail);
      return;
    }

    setEmailLoading(true);

    const { error } = await supabase.auth.updateUser({
      email
    });

    setEmailLoading(false);

    if (error) {
      setNotice(`${t.emailError} ${error.message}`);
      return;
    }

    setNewEmail("");

    setNotice(
      "Solicitud enviada. Revisa el correo nuevo y completa la verificación de Supabase."
    );
  }

  // Cargar foto desde el dispositivo
  async function uploadProfilePhoto(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice(t.photoInvalid);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setNotice(t.photoTooLarge);
      e.target.value = "";
      return;
    }

    if (!session?.user?.id) {
      setNotice(t.loginRequired);
      return;
    }

    setPhotoLoading(true);

    const extension = (
      file.name.split(".").pop() || "jpg"
    ).toLowerCase().replace(/[^a-z0-9]/g, "");

    const filePath = `${session.user.id}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600"
      });

    if (uploadError) {
      setPhotoLoading(false);
      setNotice(
        "No se pudo cargar la foto. Comprueba la configuración del almacenamiento: " +
        uploadError.message
      );
      e.target.value = "";
      return;
    }

    const { data: publicData } = supabase.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(filePath);

    const photoUrl =
      `${publicData.publicUrl}?v=${Date.now()}`;

    const { error: profileError } = await supabase.rpc(
      "update_my_profile",
      {
        p_full_name: profileName.trim() || userName,
        p_avatar_url: photoUrl
      }
    );

    setPhotoLoading(false);
    e.target.value = "";

    if (profileError) {
      setNotice(
        "La foto se cargó, pero no se pudo guardar en el perfil: " +
        profileError.message
      );
      return;
    }

    setProfile({
      ...profile,
      avatar_url: photoUrl,
      full_name: profileName.trim() || userName
    });

    setNotice(t.photoUpdated);
  }

  // Guardar nombre y foto en el perfil
  async function saveProfile() {
    const name = profileName.trim();

    if (!name) {
      setNotice(t.nameRequired);
      return;
    }

    setSavingProfile(true);

    const { error } = await supabase.rpc(
      "update_my_profile",
      {
        p_full_name: name,
        p_avatar_url: profile?.avatar_url || ""
      }
    );

    setSavingProfile(false);

    if (error) {
      setNotice(`${t.profileError} ${error.message}`);
      return;
    }

    setProfile({
      ...profile,
      full_name: name
    });

    setNotice(t.profileUpdated);
  }

  function num(value) {
    return value === "" || value === null
      ? null
      : Number(value);
  }

  async function save(e) {
    e.preventDefault();

    const online = Number(form.miners_online || 0);
    const offline = Number(form.miners_offline || 0);

    if (!form.work_shift) {
      setNotice(t.selectWorkShift);
      return;
    }

    if (!form.report_date) {
      setNotice(t.selectOperationalDate);
      return;
    }

    if (online + offline > TOTAL_MINERS) {
      setNotice(
        "Error: las mineradoras operativas y offline no pueden superar las 1280 unidades."
      );
      return;
    }

    if (online < 0 || offline < 0) {
      setNotice(t.minersNegative);
      return;
    }

    if (
      Number(form.generators_online) < 0 ||
      Number(form.generators_online) > 3
    ) {
      setNotice(t.generatorsLimit);
      return;
    }

    if (
      form.rest_type !== "none" &&
      !form.rest_person.trim()
    ) {
      setNotice(t.restPersonRequired);
      return;
    }

    const payload = {
      report_date: form.report_date,
      work_shift: form.work_shift,
      created_by: session.user.id,
      operators: form.operator_names,
      day_off: form.rest_type === "none"
        ? "No"
        : `${form.rest_type}|${form.rest_person.trim()}`,
      hashrate_ph: num(form.hashrate),
      miners_online: num(form.miners_online),
      miners_offline: num(form.miners_offline),
      availability_pct: num(availability),
      power_mw: num(form.power_mw),
      month_consumption_kwh: num(form.monthly_kwh),
      generators_running: num(form.generators_online),
      occurrences: form.incidents,
      maintenance: form.maintenance,
      next_shift_pending: form.next_shift_pending,
      supervisor_instructions: form.supervisor_guidance
    };

    let result;

    if (editing) {
      const reportToEdit = reports.find(r => r.id === editing);

      if (
        !reportToEdit ||
        (!isAdmin && reportToEdit.created_by !== session.user.id)
      ) {
        setNotice(t.noEditPermission);
        return;
      }

      const { created_by, ...updatePayload } = payload;

      let updateQuery = supabase
        .from("daily_reports")
        .update(updatePayload)
        .eq("id", editing);

      if (!isAdmin) {
        updateQuery = updateQuery.eq(
          "created_by",
          session.user.id
        );
      }

      result = await updateQuery.select().single();
    } else {
      result = await supabase
        .from("daily_reports")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setNotice(result.error.message);
    } else {
      setNotice(t.reportSaved);
      setForm(createBlankForm());
      setEditing(null);
      await loadReports();
    }
  }

  async function statusChange(id, status) {
    const { error } = await supabase.rpc(
      "set_operator_status",
      {
        target_user_id: id,
        new_status: status
      }
    );

    if (error) {
      setNotice(error.message);
    } else {
      setNotice(t.statusUpdated);
      await loadUsers();
    }
  }

  // Asignar contraseña temporal a un operador mediante la Edge Function.
  // La función del servidor verifica que quien realiza la operación sea el admin.
  async function assignTemporaryPassword(id) {
    if (!isAdmin) {
      setNotice(t.noPasswordPermission);
      return;
    }

    if (temporaryPassword.length < 12) {
      setNotice(t.tempPasswordMinLabel);
      return;
    }

    if (temporaryPassword.length > 128) {
      setNotice(t.tempPasswordMax);
      return;
    }

    const confirmed = window.confirm(
      "¿Confirmas asignar esta contraseña temporal? El operador deberá crear una contraseña nueva antes de utilizar el sistema."
    );

    if (!confirmed) return;

    setTemporaryPasswordLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-manage-user",
        {
          body: {
            action: "set_temp_password",
            targetUserId: id,
            temporaryPassword
          }
        }
      );

      if (error) {
        setNotice(
          "No se pudo asignar la contraseña temporal: " + error.message
        );
        return;
      }

      if (!data?.success) {
        setNotice(
          data?.message || "La función no pudo completar la operación."
        );
        return;
      }

      setTemporaryPassword("");
      setTemporaryPasswordUser("");
      setNotice(
        data.message ||
        "Contraseña temporal asignada correctamente."
      );

      await loadUsers();
    } catch (error) {
      setNotice(
        "Error al comunicarse con la función administrativa: " +
        (error?.message || "Error desconocido")
      );
    } finally {
      setTemporaryPasswordLoading(false);
    }
  }

  function edit(r) {
    const canEdit =
      isAdmin || r.created_by === session.user.id;

    if (!canEdit) {
      setNotice(t.noEditPermission);
      return;
    }

    setEditing(r.id);

    const dayOff = r.day_off || "";
    const oldType = dayOff.toLowerCase();

    setForm({
      report_date: r.report_date,
      work_shift: r.work_shift || "",
      operator_names: r.operators || "",
      rest_type: dayOff.includes("|")
        ? dayOff.split("|")[0]
        : (
          ["folga", "atestado", "banco de horas", "falta"].includes(oldType)
            ? oldType
            : (["sí", "sim"].includes(oldType) ? "folga" : "none")
        ),
      rest_person: dayOff.includes("|")
        ? dayOff.split("|").slice(1).join("|")
        : "",
      hashrate: r.hashrate_ph ?? "",
      miners_online: r.miners_online ?? "",
      miners_offline: r.miners_offline ?? "",
      availability: r.availability_pct ?? "",
      power_mw: r.power_mw ?? "",
      monthly_kwh: r.month_consumption_kwh ?? "",
      generators_online: r.generators_running ?? "",
      incidents: r.occurrences || "",
      maintenance: r.maintenance || "",
      next_shift_pending: r.next_shift_pending || "",
      supervisor_guidance: r.supervisor_instructions || ""
    });

    setActiveSection("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function deleteReport(r) {
    const canDelete =
      isAdmin || r.created_by === session.user.id;

    if (!canDelete) {
      setNotice(t.noDeletePermission);
      return;
    }

    const confirmed = window.confirm(
      `${t.confirmDelete}\n${r.report_date} · ${t.shiftWord} ${r.work_shift || "-"}`
    );

    if (!confirmed) return;

    let deleteQuery = supabase
      .from("daily_reports")
      .delete()
      .eq("id", r.id);

    if (!isAdmin) {
      deleteQuery = deleteQuery.eq(
        "created_by",
        session.user.id
      );
    }

    const { data, error } = await deleteQuery.select("id");

    if (error) {
      setNotice(`${t.deleteFailed} ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setNotice(
        t.noDeleteResult
      );
      return;
    }

    setNotice(t.reportDeleted);

    if (editing === r.id) {
      setEditing(null);
      setForm(createBlankForm());
    }

    await loadReports();
  }

  function restText(value) {
    if (!value || value === "No") return t.noRest;

    if (value.includes("|")) {
      const parts = value.split("|");
      return `${parts[0]} — ${parts.slice(1).join("|")}`;
    }

    return value;
  }

  function reportCell(label, value) {
    return (
      <div style={reportStyles.cell}>
        <span style={reportStyles.cellLabel}>{label}</span>
        <span style={reportStyles.cellValue}>
          {value === null || value === undefined || value === ""
            ? "-"
            : String(value)}
        </span>
      </div>
    );
  }

  function renderReport(r) {
    const metrics = [
      [t.workShift, r.work_shift ? `${t.shift} ${r.work_shift}` : "-"],
      [t.operators, r.operators],
      [t.restLabel, restText(r.day_off)],
      [t.hash, r.hashrate_ph],
      [t.availabilityLabel, r.availability_pct],
      [t.onlineLabel, r.miners_online],
      [t.offlineLabel, r.miners_offline],
      [t.powerLabel, r.power_mw],
      [t.monthLabel, r.month_consumption_kwh],
      [t.generatorsLabel, `${r.generators_running ?? "-"}/3`]
    ];

    const details = [
      [t.incidentsLabel, r.occurrences],
      [t.maintenanceLabel, r.maintenance],
      [t.pendingLabel, r.next_shift_pending],
      [t.guidanceLabel, r.supervisor_instructions]
    ];

    return (
      <div
        id={`report-${r.id}`}
        key={r.id}
        style={reportStyles.container}
      >
        <div style={reportStyles.header}>
          <img
            src={LOGO}
            alt="ADECOAGRO"
            style={reportStyles.logo}
            crossOrigin="anonymous"
          />

          <div>
            <h2 style={reportStyles.brand}>
              ADECOAGRO MINING CLOUD
            </h2>
            <p style={reportStyles.subtitle}>
              {t.reportSubtitle}
            </p>
            <p style={{
              color: "#344d3e",
              fontSize: "12px",
              fontWeight: "bold",
              margin: "8px 0 0"
            }}>
              {t.dateLabel}: {r.report_date || "-"}
            </p>
          </div>
        </div>

        <div style={reportStyles.sectionTitle}>
          {t.operationalInfo}
        </div>

        <div style={reportStyles.grid}>
          {metrics.map(([label, value]) => (
            <React.Fragment key={label}>
              {reportCell(label, value)}
            </React.Fragment>
          ))}
        </div>

        <div style={reportStyles.sectionTitle}>
          {t.shiftDetails}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "9px"
        }}>
          {details.map(([label, value]) => (
            <React.Fragment key={label}>
              {reportCell(label, value)}
            </React.Fragment>
          ))}
        </div>

        <div style={reportStyles.footer}>
          {t.footer}
        </div>
      </div>
    );
  }

  async function generateQR(r) {
    try {
      const url =
        `${window.location.origin}/?report=${encodeURIComponent(r.id)}`;

      const image = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "H"
      });

      setQrImage(image);
      setQrReport(r);
    } catch (error) {
      setNotice(`${t.qrError} ${error.message}`);
    }
  }

  function shareWhatsApp(r) {
    const url =
      `${window.location.origin}/?report=${encodeURIComponent(r.id)}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        "ADECOAGRO MINING CLOUD - Informe operacional: " + url
      )}`,
      "_blank"
    );
  }

  async function exportPdf(r) {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const gap = 6;
      const cardWidth = (pageWidth - margin * 2 - gap) / 2;
      const fullWidth = pageWidth - margin * 2;

      let y = 48;

      async function getLogo() {
        return new Promise(resolve => {
          const image = new Image();
          image.crossOrigin = "anonymous";

          image.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;

              const context = canvas.getContext("2d");
              context.drawImage(image, 0, 0);

              resolve(canvas.toDataURL("image/png"));
            } catch {
              resolve(null);
            }
          };

          image.onerror = () => resolve(null);
          image.src = LOGO;
        });
      }

      const logoData = await getLogo();

      function header() {
        doc.setFillColor(22, 77, 53);
        doc.rect(0, 0, pageWidth, 36, "F");

        if (logoData) {
          doc.addImage(logoData, "PNG", margin, 5, 25, 25);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text("ADECOAGRO MINING CLOUD", logoData ? 44 : margin, 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(t.reportSubtitle, logoData ? 44 : margin, 23);

        doc.setTextColor(35, 65, 49);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${t.dateLabel}: ${r.report_date || "-"}`, margin, 44);
        doc.text(`${t.shiftLabel}: ${r.work_shift || "-"}`, margin + 75, 44);
      }

      function newPage() {
        doc.addPage();
        header();
        y = 51;
      }

      function drawSection(title) {
        if (y + 11 > pageHeight - 15) newPage();

        doc.setFillColor(22, 77, 53);
        doc.roundedRect(margin, y, fullWidth, 8, 1.5, 1.5, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(title, margin + 4, y + 5.5);

        y += 12;
      }

      function drawCard(label, value, x, width) {
        const text = String(value ?? "-").trim() || "-";
        const lines = doc.splitTextToSize(text, width - 8);
        const height = Math.max(19, 13 + lines.length * 4.5);

        if (y + height > pageHeight - 15) {
          newPage();
        }

        doc.setFillColor(251, 253, 251);
        doc.setDrawColor(185, 203, 189);
        doc.roundedRect(x, y, width, height, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(38, 112, 75);
        doc.text(label, x + 4, y + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(24, 41, 35);
        doc.text(lines, x + 4, y + 12);

        return height;
      }

      header();
      drawSection(t.operationalInfo);

      const metrics = [
        [t.workShift, r.work_shift ? `${t.shift} ${r.work_shift}` : "-"],
        [t.operators, r.operators],
        [t.restLabel, restText(r.day_off)],
        [t.hash, r.hashrate_ph],
        [t.availabilityLabel, r.availability_pct],
        [t.onlineLabel, r.miners_online],
        [t.offlineLabel, r.miners_offline],
        [t.powerLabel, r.power_mw],
        [t.monthLabel, r.month_consumption_kwh],
        [t.generatorsLabel, `${r.generators_running ?? "-"}/3`]
      ];

      for (let i = 0; i < metrics.length; i += 2) {
        const leftHeight = drawCard(
          metrics[i][0],
          metrics[i][1],
          margin,
          cardWidth
        );

        const rightHeight = metrics[i + 1]
          ? drawCard(
              metrics[i + 1][0],
              metrics[i + 1][1],
              margin + cardWidth + gap,
              cardWidth
            )
          : 0;

        y += Math.max(leftHeight, rightHeight) + 5;
      }

      drawSection(t.shiftDetails);

      const details = [
        [t.incidentsLabel, r.occurrences],
        [t.maintenanceLabel, r.maintenance],
        [t.pendingLabel, r.next_shift_pending],
        [t.guidanceLabel, r.supervisor_instructions]
      ];

      details.forEach(([label, value]) => {
        const height = drawCard(label, value, margin, fullWidth);
        y += height + 5;
      });

      const pages = doc.internal.getNumberOfPages();

      for (let page = 1; page <= pages; page++) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 125, 115);
        doc.text(
          `${t.footer} · ${page}/${pages}`,
          pageWidth / 2,
          pageHeight - 7,
          { align: "center" }
        );
      }

      doc.save(
        `adecoagro-${r.report_date}-turno-${r.work_shift || "sin-turno"}.pdf`
      );
    } catch (error) {
      setNotice(`${t.pdfError} ${error.message}`);
    }
  }

  async function exportJpg(r) {
    try {
      const node = document.getElementById(`report-${r.id}`);

      if (!node) {
        setNotice(t.reportNotFound);
        return;
      }

      const data = await toJpeg(node, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true
      });

      const a = document.createElement("a");
      a.href = data;
      a.download =
        `adecoagro-${r.report_date}-turno-${r.work_shift || "sin-turno"}.jpg`;
      a.click();
    } catch (error) {
      setNotice(`${t.jpgError} ${error.message}`);
    }
  }

  function label(k) {
    return ({
      report_date: t.date,
      work_shift: t.shift,
      operator_names: t.operator,
      rest_type: t.rest,
      rest_person:
        lang === "pt-BR"
          ? "Nome da pessoa"
          : lang === "es-419"
            ? "Nombre de la persona"
            : "Person's name",
      hashrate: t.hash,
      miners_online: t.online,
      miners_offline: t.offline,
      availability: t.availability,
      power_mw: t.power,
      monthly_kwh: t.month,
      generators_online: t.generators,
      incidents: t.events,
      maintenance: t.maintenance,
      next_shift_pending: t.pending,
      supervisor_guidance: t.guidance
    })[k];
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRecoveryMode(false);
    setActiveSection("home");
  }

  if (!configured) {
    return (
      <main className="center">
        <section className="panel">
          <h1>ADECOAGRO MINING CLOUD</h1>
          <p>{t.supabaseMissing}</p>
          <p>{t.supabaseSetup}</p>
        </section>
      </main>
    );
  }

  // Pantalla de recuperación o establecimiento de contraseña
  if (recoveryMode) {
    return (
      <main className="app-layout unauthenticated">
        <header>
          <div className="brand-area">
            <img src={LOGO} alt="ADECO ENERGIA" className="adeco-logo" />
            <div>
              <div className="brand">
                ADECOAGRO <span>MINING CLOUD</span>
              </div>
              <small>Energia em crescimento</small>
            </div>
          </div>
        </header>

        <section className="panel login">
          <h2>{t.createNewPassword}</h2>
          <p>
            {t.newPasswordIntro}
          </p>

          <form onSubmit={updateOwnPassword}>
            <label>
              {t.newPassword}
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <label>
              {t.confirmPassword}
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <button type="submit" disabled={passwordLoading}>
              {passwordLoading ? t.updating : t.savePassword}
            </button>
          </form>

          {notice && <p>{notice}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className={`app-layout ${session ? "authenticated" : "unauthenticated"}`}>
      <header>
        <div className="brand-area">
          <img
            src={LOGO}
            alt="ADECO ENERGIA"
            className="adeco-logo"
          />

          <div>
            <div className="brand">
              ADECOAGRO <span>MINING CLOUD</span>
            </div>
            <small>Energia em crescimento</small>
          </div>
        </div>

        <div className="tools">
          <select
            value={lang}
            onChange={e => {
              setLang(e.target.value);
              localStorage.setItem("amc-lang", e.target.value);
            }}
          >
            <option value="pt-BR">Português</option>
            <option value="es-419">Español</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </header>

{!session ? (
  <section className="panel login">
    <h1>ADECOAGRO MINING CLOUD</h1>
    <p>{t.googleRegistration}</p>

    <button onClick={signInGoogle} disabled={authLoading}>
      {authLoading ? t.wait : t.login}
    </button>

    <div className="auth-divider">
      <span>{t.or}</span>
    </div>

    <form onSubmit={signInEmail}>
      <label>
        {t.email}
        <input
          type="email"
          autoComplete="username"
          value={authEmail}
          onChange={e => setAuthEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          required
        />
      </label>

      <label>
        {t.password}
        <div className="password-input">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            required
          />

          <button
            type="button"
            className="secondary"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? t.hide : t.show}
          </button>
        </div>
      </label>

      <button type="submit" disabled={authLoading}>
        {authLoading ? t.entering : t.loginEmail}
      </button>
    </form>

    <button
      type="button"
      className="secondary"
      onClick={recoverPassword}
      disabled={authLoading}
    >
      {t.forgotPassword}
    </button>

    {notice && <p>{notice}</p>}
  </section>

      ) : !profile ? (
        <section className="panel">
          <p>{t.loadingProfile}</p>
        </section>
      ) : profile.status !== "approved" && !isAdmin ? (
        <section className="panel">
          <h2>
            {profile.status === "blocked" ? t.blocked : t.pendingStatus}
          </h2>
          <p>
            {profile.status === "blocked"
              ? t.contactAdmin
              : t.waiting}
          </p>

          <button className="secondary" onClick={signOut}>
            {t.logout}
          </button>
        </section>
      ) : mustChangePassword ? (
        <section className="panel login">
          <h2>{t.mandatoryPasswordTitle}</h2>
          <p>
            {t.mandatoryPasswordText}
          </p>

          <form onSubmit={updateOwnPassword}>
            <label>
              {t.newPassword}
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <label>
              {t.confirmPassword}
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <button type="submit" disabled={passwordLoading}>
              {passwordLoading ? t.updating : t.changePasswordContinue}
            </button>
          </form>

          <button className="secondary" onClick={signOut}>
            {t.logout}
          </button>
        </section>
      ) : (
        <>
          <aside className="sidebar">
            <div className="sidebar-user">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={t.profilePhotoAlt}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar">👤</div>
              )}

              <strong>{userName}</strong>
              <small>{session?.user?.email}</small>
            </div>

            <nav className="sidebar-menu">
              <button
                className={activeSection === "home" ? "menu-active" : "menu-button"}
                onClick={() => setActiveSection("home")}
              >
                🏠 {t.home}
              </button>

              <button
                className={activeSection === "history" ? "menu-active" : "menu-button"}
                onClick={() => setActiveSection("history")}
              >
                📁 {t.history}
              </button>

              {isAdmin && (
                <button
                  className={activeSection === "users" ? "menu-active" : "menu-button"}
                  onClick={() => setActiveSection("users")}
                >
                  👥 {t.admin}
                </button>
              )}

              <button
                className={activeSection === "profile" ? "menu-active" : "menu-button"}
                onClick={() => setActiveSection("profile")}
              >
                👤 {t.profile}
              </button>

              <button className="menu-button" onClick={signOut}>
                🚪 {t.logout}
              </button>
            </nav>
          </aside>

          {activeSection === "home" && (
            <section className="panel">
              <h2>{t.title}</h2>

              <section className="dashboard-section" aria-label={t.dashboard}>
                <div className="dashboard-heading">
                  <h3>{t.dashboard}</h3>
                  <span>{latestReport ? `${t.latestReport}: ${latestReport.report_date} · ${t.shiftLabel} ${latestReport.work_shift || "-"}` : t.noDashboardData}</span>
                </div>
                {latestReport ? (
                  <div className="dashboard-grid">
                    <div className="metric-card">
                      <span>{t.minersOnline}</span>
                      <strong>{latestReport.miners_online ?? 0}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{t.minersOffline}</span>
                      <strong>{latestReport.miners_offline ?? 0}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{t.availability}</span>
                      <strong>{Number(latestReport.availability_pct || 0).toFixed(2)}%</strong>
                    </div>
                    <div className="metric-card">
                      <span>{t.electricity}</span>
                      <strong>{latestReport.power_mw ?? 0} MW</strong>
                    </div>
                    <div className="metric-card">
                      <span>{t.month}</span>
                      <strong>{latestReport.month_consumption_kwh ?? 0} kWh</strong>
                    </div>
                    <div className="metric-card">
                      <span>{t.activeGenerators}</span>
                      <strong>{latestReport.generators_running ?? 0}/3</strong>
                    </div>
                  </div>
                ) : (
                  <p className="dashboard-empty">{t.noDashboardData}</p>
                )}
              </section>

              <form onSubmit={save} lang={lang} spellCheck={true}>
                <div className="fields">
                  {fields.map(k => (
                    <label
                      key={k}
                      className={[
                        "incidents",
                        "maintenance",
                        "next_shift_pending",
                        "supervisor_guidance"
                      ].includes(k) ? "wide" : ""}
                    >
                      {label(k)}

                      {k === "work_shift" ? (
                        <select
                          value={form.work_shift}
                          onChange={e => setForm({
                            ...form,
                            work_shift: e.target.value
                          })}
                          required
                        >
                          <option value="">{t.selectShift}</option>
                          <option value="A">{t.shiftA}</option>
                          <option value="B">{t.shiftB}</option>
                          <option value="C">{t.shiftC}</option>
                        </select>
                      ) : k === "rest_type" ? (
                        <select
                          value={form.rest_type}
                          onChange={e => setForm({
                            ...form,
                            rest_type: e.target.value
                          })}
                        >
                          <option value="none">
                            {lang === "pt-BR"
                              ? "Sem descanso"
                              : lang === "es-419"
                                ? "Sin descanso"
                                : "No absence"}
                          </option>
                          <option value="folga">
                            {lang === "pt-BR" ? "Folga" : lang === "es-419" ? "Descanso" : "Day off"}
                          </option>
                          <option value="atestado">
                            {lang === "pt-BR" ? "Atestado" : lang === "es-419" ? "Certificado médico" : "Medical leave"}
                          </option>
                          <option value="banco de horas">{t.timeBank}</option>
                          <option value="falta">
                            {lang === "pt-BR" ? "Falta" : lang === "es-419" ? "Ausencia" : "Absence"}
                          </option>
                        </select>
                      ) : k === "rest_person" ? (
                        <input
                          type="text"
                          lang={lang}
                          spellCheck={true}
                          value={form.rest_person}
                          onChange={e => setForm({
                            ...form,
                            rest_person: e.target.value
                          })}
                          placeholder={t.restPerson}
                          required={form.rest_type !== "none"}
                        />
                      ) : [
                        "incidents",
                        "maintenance",
                        "next_shift_pending",
                        "supervisor_guidance"
                      ].includes(k) ? (
                        <textarea
                          rows="3"
                          lang={lang}
                          spellCheck={true}
                          value={form[k]}
                          onChange={e => setForm({
                            ...form,
                            [k]: e.target.value
                          })}
                        />
                      ) : k === "availability" ? (
                        <input
                          type="number"
                          value={availability}
                          readOnly
                          placeholder="0.00"
                        />
                      ) : k === "generators_online" ? (
                        <select
                          value={form.generators_online}
                          onChange={e => setForm({
                            ...form,
                            generators_online: e.target.value
                          })}
                          required
                        >
                          <option value="">{t.select}</option>
                          <option value="0">0/3</option>
                          <option value="1">1/3</option>
                          <option value="2">2/3</option>
                          <option value="3">3/3</option>
                        </select>
                      ) : (
                        <input
                          required={
                            k === "report_date" ||
                            k === "operator_names"
                          }
                          type={
                            k === "report_date"
                              ? "date"
                              : k === "operator_names"
                                ? "text"
                                : "number"
                          }
                          min={
                            ["miners_online", "miners_offline"].includes(k)
                              ? 0
                              : undefined
                          }
                          max={
                            ["miners_online", "miners_offline"].includes(k)
                              ? TOTAL_MINERS
                              : undefined
                          }
                          step={
                            ["miners_online", "miners_offline"].includes(k)
                              ? 1
                              : "any"
                          }
                          value={form[k]}
                          onChange={e => setForm({
                            ...form,
                            [k]: e.target.value
                          })}
                        />
                      )}
                    </label>
                  ))}
                </div>

                <button type="submit">{t.save}</button>

                {editing && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditing(null);
                      setForm(createBlankForm());
                    }}
                  >
                    {t.cancelEdit}
                  </button>
                )}
              </form>
            </section>
          )}

          {activeSection === "history" && (
            <section className="panel">
              <h2>{t.history}</h2>

              <div className="history-filters">
                <label>
                  {t.filterDate}
                  <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)} />
                </label>
                <label>
                  {t.filterShift}
                  <select value={historyShift} onChange={e => setHistoryShift(e.target.value)}>
                    <option value="">{t.allShifts}</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </label>
                <label>
                  {t.filterOperator}
                  <input type="search" value={historyOperator} onChange={e => setHistoryOperator(e.target.value)} placeholder={t.filterOperator} />
                </label>
                <button type="button" className="secondary filter-clear" onClick={() => { setHistoryDate(""); setHistoryShift(""); setHistoryOperator(""); }}>
                  {t.clearFilters}
                </button>
              </div>
              <p className="history-count">{filteredReports.length} {t.results}</p>

              {filteredReports.length === 0 ? (
                <p>{t.noReports}</p>
              ) : (
                filteredReports.map(r => {
                  const canManage =
                    isAdmin || r.created_by === session.user.id;

                  return (
                    <article className="report" key={r.id}>
                      <div className="reporthead">
                        <h3>
                          {r.report_date} · {r.work_shift ? `${t.shiftWord} ${r.work_shift} · ` : ""}
                          {r.operators}
                        </h3>

                        <div className="report-actions">
                          <button
                            className="secondary"
                            onClick={() => exportPdf(r)}
                          >
                            PDF
                          </button>

                          <button
                            className="secondary"
                            onClick={() => exportJpg(r)}
                          >
                            JPG
                          </button>

                          <button
                            className="secondary"
                            onClick={() => generateQR(r)}
                          >
                            QR
                          </button>

                          <button
                            className="secondary"
                            onClick={() => shareWhatsApp(r)}
                          >
                            WhatsApp
                          </button>

                          {canManage && (
                            <>
                              <button
                                className="secondary"
                                onClick={() => edit(r)}
                              >
                                {t.edit}
                              </button>

                              <button
                                className="danger"
                                onClick={() => deleteReport(r)}
                              >
                                {t.delete}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {renderReport(r)}
                    </article>
                  );
                })
              )}
            </section>
          )}

          {activeSection === "users" && isAdmin && (
            <section className="panel">
              <h2>{t.admin}</h2>

              <p>
                {t.mainAdminPrefix} {ADMIN}. {t.accountLimit}
              </p>

              {users.map(u => (
                <div className="userrow" key={u.id}>
                  <div className="userrow-main">
                    <b>{u.full_name || u.email}</b>
                    <small>
                      {u.email} · {u.status} · {u.role}
                      {u.must_change_password ? ` · ${t.passwordPending}` : ""}
                    </small>
                  </div>

                  <div className="userrow-actions">
                    {u.role !== "admin" && (
                      <>
                        <button onClick={() => statusChange(u.id, "approved")}>
                          {t.approve}
                        </button>

                        <button
                          className="danger"
                          onClick={() => statusChange(u.id, "blocked")}
                        >
                          {t.block}
                        </button>

                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setTemporaryPasswordUser(
                              temporaryPasswordUser === u.id ? "" : u.id
                            );
                            setTemporaryPassword("");
                          }}
                        >
                          {t.assignTempPassword}
                        </button>

                        {temporaryPasswordUser === u.id && (
                          <div className="temporary-password-form">
                            <label>
                              {t.tempPasswordMinLabel}
                              <input
                                type="password"
                                autoComplete="new-password"
                                minLength={12}
                                maxLength={128}
                                value={temporaryPassword}
                                onChange={e => setTemporaryPassword(e.target.value)}
                                placeholder={t.tempPasswordPlaceholder}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => assignTemporaryPassword(u.id)}
                              disabled={
                                temporaryPasswordLoading ||
                                temporaryPassword.length < 12
                              }
                            >
                              {temporaryPasswordLoading
                                ? "Asignando..."
                                : t.confirmTempPassword}
                            </button>

                            <button
                              type="button"
                              className="secondary"
                              onClick={() => {
                                setTemporaryPasswordUser("");
                                setTemporaryPassword("");
                              }}
                              disabled={temporaryPasswordLoading}
                            >
                              {t.cancel}
                            </button>

                            <small>
                              {t.operatorMustChange}

                            </small>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}

          {activeSection === "profile" && (
            <section className="panel">
              <h2>{t.profile}</h2>

              <div className="profile-card">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={t.profilePhotoAlt}
                    className="profile-photo"
                  />
                ) : (
                  <div className="profile-photo-placeholder">👤</div>
                )}

                <label>
                  {t.changePhoto}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadProfilePhoto}
                    disabled={photoLoading}
                  />
                </label>

                {photoLoading && <p>{t.uploadingPhoto}</p>}

                <label>
                  {t.profileName}
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder={t.namePlaceholder}
                  />
                </label>

                <label>
                  {t.currentEmail}
                  <input
                    type="email"
                    value={session?.user?.email || ""}
                    readOnly
                  />
                </label>

                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? t.saving : t.saveChanges}
                </button>

                <hr />

                <h3>{t.changeEmailHeading}</h3>
                <p>
                  {t.changeEmailDescription}
                </p>

                <form onSubmit={changeOwnEmail}>
                  <label>
                    {t.newEmail}
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder={t.newEmailPlaceholder}
                      required
                    />
                  </label>

                  <button type="submit" disabled={emailLoading}>
                    {emailLoading ? t.sending : t.requestEmailChange}
                  </button>
                </form>

                <hr />

                <h3>{t.passwordSection}</h3>
                <p>
                  {t.passwordDescription}

                </p>

                <form onSubmit={updateOwnPassword}>
                  <label>
                    {t.newPassword}
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      minLength={8}
                      placeholder={t.minPassword}
                      required
                    />
                  </label>

                  <label>
                    {t.confirmNewPassword}
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      minLength={8}
                      placeholder={t.repeatPassword}
                      required
                    />
                  </label>

                  <button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? t.updating : t.updatePasswordButton}
                  </button>
                </form>

                <hr />

                <h3>{t.accountInfo}</h3>

                <label>
                  {t.lastAccess}
                  <input
                    type="text"
                    value={
                      session?.user?.last_sign_in_at
                        ? new Date(session.user.last_sign_in_at).toLocaleString()
                        : t.unavailable
                    }
                    readOnly
                  />
                </label>

                <label>
                  {t.accountType}
                  <input
                    type="text"
                    value={profile?.role || "operator"}
                    readOnly
                  />
                </label>

                <label>
                  {t.accountStatus}
                  <input
                    type="text"
                    value={profile?.status || ""}
                    readOnly
                  />
                </label>
              </div>
            </section>
          )}
        </>
      )}

      {qrReport && qrImage && (
        <div className="qr-overlay">
          <section className="panel qr-modal">
            <h2>{t.shareReport}</h2>

            <p>
              {qrReport.report_date} ·
              {qrReport.work_shift ? ` Turno ${qrReport.work_shift} ·` : ""}
              {" "}{qrReport.operators}
            </p>

            <img src={qrImage} alt="Código QR del informe" />

            <p>{t.qrScanInstruction}</p>

            <button onClick={() => shareWhatsApp(qrReport)}>
              {t.shareWhatsApp}
            </button>

            <button
              className="secondary"
              onClick={() => {
                setQrReport(null);
                setQrImage("");
              }}
            >
              {t.close}
            </button>
          </section>
        </div>
      )}

      {notice && (
        <div
          className="notice"
          onClick={() => setNotice("")}
        >
          {notice} ×
        </div>
      )}

      <footer>
        {t.footer}
      </footer>
    </main>
  );
}
