// const BASE_API_URL = "http://localhost:3000";
const BASE_API_URL = "https://sorteio-ruddy.vercel.app";

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// Função para copiar o código PIX
function copyPix() {
  const copyText = document.getElementById("pixCopiaCola");
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand("copy");
  navigator.clipboard.writeText(copyText.value);
  alert("Código PIX copiado com sucesso!");
}

// Função para pegar parâmetros da URL
function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

$(document).ready(function () {
  // Pega o order_id da URL
  const orderId = getUrlParameter("order_id");
  if (!orderId) {
    console.error("order_id não encontrado na URL");
    window.location.href = "/";
    return;
  }

  const token = document.querySelector('meta[name="order-token"]').content;
  let tempoInicial = parseInt("15"); // 15 minutos
  let progressoMaximo = 100;
  let tempoRestante;
  let statusInterval;

  // Inicializa o tempo restante
  if (localStorage.getItem(token)) {
    tempoRestante = parseInt(localStorage.getItem(token));
  } else {
    tempoRestante = tempoInicial * 60;
    localStorage.setItem(token, tempoRestante);
  }

  // Função para mostrar os números do pedido
  function mostrarNumeros(order) {
    let numerosHtml = "";
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach((item) => {
        if (item.numbers && item.numbers.length > 0) {
          numerosHtml += `
            <div class="col-12">
              <div class="alert alert-success p-2 font-xss">
                <strong>Seus números:</strong><br>
                ${item.numbers.join(", ")}
              </div>
            </div>
          `;
        }
      });
    }

    // Atualiza o status e mostra os números
    $("#payment-status")
      .removeClass("d-none alert-info")
      .addClass("alert-success")
      .html("Pagamento aprovado! Seus números estão abaixo:");

    // Atualiza a área de números
    $("[data-nosnippet='true']").html(numerosHtml);

    // Limpa os intervalos e localStorage
    clearInterval(statusInterval);
    clearInterval(tempoInterval);
    localStorage.removeItem(token);
  }

  // Função para carregar dados iniciais do pedido
  async function carregarDadosPedido() {
    try {
      const response = await fetch(`${BASE_API_URL}/api/orders/${orderId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.status === "success") {
        const order = data.order;

        // Atualiza o QR Code e código PIX
        if (order.pix_qrcode) {
          const qrcodeImage = document.getElementById("qrcode-image");
          qrcodeImage.src = `data:image/png;base64,${order.pix_qrcode}`;
          qrcodeImage.style.display = "block";
          qrcodeImage.style.margin = "0 auto";
        }

        if (order.pix_code) {
          const pixInput = document.getElementById("pixCopiaCola");
          pixInput.value = order.pix_code;
        }

        // Atualiza os detalhes da compra
        const detalhesCompra = {
          ref: order.ref,
          nome: order.user.name,
          transacao: order.payment_id,
          telefone: order.user.phone,
          dataHora: new Date(order.created_at).toLocaleString("pt-BR"),
          quantidade: order.quantity,
          valor: order.total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
        };

        // Atualiza cada campo na seção de detalhes
        $(".opacity-50.mb-1").text(detalhesCompra.ref);
        $('.result.font-xs.text-dark[style="text-transform: uppercase;"]').text(
          detalhesCompra.nome
        );
        $('.item:contains("Transação") .result.font-xs.text-dark').text(
          detalhesCompra.transacao
        );
        $('.item:contains("Telefone") .result.font-xs.text-dark').text(
          detalhesCompra.telefone
        );
        $('.item:contains("Data/Hora") .result.font-xs.text-dark').text(
          detalhesCompra.dataHora
        );
        $('.item:contains("Números/EBooks") .title.me-1.text-dark').html(
          `<i class="bi bi-card-list"></i> ${detalhesCompra.quantidade} Números/EBooks`
        );
        $('.item:contains("Valor") .result.font-xs.text-dark').text(
          detalhesCompra.valor
        );

        // Se o pedido estiver pago, atualiza a seção de números
        if (order.payment_status === "paid" && order.order_items) {
          let numerosHtml = "";
          order.order_items.forEach((item) => {
            if (item.numbers && item.numbers.length > 0) {
              numerosHtml += `
                <div class="col-12">
                  <div class="alert alert-success p-2 font-xss">
                    <strong>Seus números:</strong><br>
                    ${item.numbers.join(", ")}
                  </div>
                </div>
              `;
            }
          });
          $("[data-nosnippet='true']").html(numerosHtml);
        }

        return order.payment_status;
      }
    } catch (error) {
      console.error("Erro ao carregar dados do pedido:", error);
    }
  }

  // Função para verificar apenas o status do pagamento
  async function verificarStatusPagamento() {
    console.log("Verificando status do pagamento...");
    try {
      const response = await fetch(`${BASE_API_URL}/api/checkout/status`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ order_ref: orderId }),
      });
      const data = await response.json();

      if (data.status === "success" && data.order.status === "paid") {
        // Busca os dados completos do pedido para mostrar os números
        const orderResponse = await fetch(
          `${BASE_API_URL}/api/orders/${orderId}`,
          {
            headers: getAuthHeaders(),
          }
        );
        const orderData = await orderResponse.json();

        if (orderData.status === "success") {
          mostrarNumeros(orderData.order);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    }
  }

  // Atualiza o contador regressivo
  const tempoInterval = setInterval(function () {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    const tempoFormatado = `${String(minutos).padStart(2, "0")}:${String(
      segundos
    ).padStart(2, "0")}`;

    $("#tempo-restante").text(tempoFormatado);

    const progresso =
      ((tempoInicial * 60 - tempoRestante) / (tempoInicial * 60)) *
      progressoMaximo;
    $("#barra-progresso")
      .css("width", progresso + "%")
      .attr("aria-valuenow", progresso);

    tempoRestante--;
    localStorage.setItem(token, tempoRestante);

    if (tempoRestante < 0) {
      clearInterval(tempoInterval);
      clearInterval(statusInterval);
      localStorage.removeItem(token);
      window.location.href = "/";
    }
  }, 1000);

  // Inicia o fluxo
  carregarDadosPedido().then((paymentStatus) => {
    // Se não estiver pago, inicia a verificação de status
    if (paymentStatus !== "paid") {
      statusInterval = setInterval(verificarStatusPagamento, 5000);
    }
  });
});
