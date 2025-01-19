// Configuração da API
const BASE_API_URL = "http://localhost:3000"; // Altere para a URL do seu servidor Next.js

function fMasc(objeto, mascara) {
  obj = objeto;
  masc = mascara;
  setTimeout("fMascEx()", 1);
}

function fMascEx() {
  obj.value = masc(obj.value);
}

function mCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return cpf;
}

function mascara(i) {
  let valor = i.value.replace(/\D/g, "");

  if (isNaN(valor[valor.length - 1])) {
    i.value = valor.slice(0, -1);
    return;
  }

  i.setAttribute("maxlength", "14");

  i.value = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

$(document).ready(function () {
  $("#form-cadastrar, #cadastroModal").submit(function (e) {
    e.preventDefault();
    var phoneValue = $(".phone")
      .val()
      .replace(/[\s()-+]/g, "");

    // Validação do telefone
    if ($(".phone")) {
      if (phoneValue.length != 13) {
        alert("Telefone inválido. Por favor corrija.");
        return;
      }
    }

    // Validar apenas telefone
    fetch(`${BASE_API_URL}/api/auth/validate-phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: phoneValue }),
    })
      .then((res) => res.json())
      .then((phoneResp) => {
        // Se telefone já existe, mostrar erro
        if (phoneResp.exists) {
          console.log("Telefone já cadastrado");
          return;
        }

        // Se passou a validação, fazer o registro
        const formData = {
          firstname: $(this).find('[name="firstname"]').val(),
          lastname: $(this).find('[name="lastname"]').val(),
          phone: phoneValue,
        };

        fetch(`${BASE_API_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })
          .then((res) => res.json())
          .then((resp) => {
            if (resp.status === "success") {
              $(".btn-close").click();
              $("#overlay").fadeIn(300);

              // Adiciona ao carrinho e processa pedido
              add_cart().then(() => {
                place_order();
              });
            } else {
              console.log(resp.error || "Ocorreu um erro ao cadastrar");
            }
          })
          .catch((err) => {
            console.error(err);
            console.log("Ocorreu um erro ao cadastrar");
          });
      })
      .catch((err) => {
        console.error(err);
        console.log("Ocorreu um erro na validação dos dados");
      });
  });
});

$(document).ready(function () {
  $("#loginModal").submit(function (e) {
    e.preventDefault();
    let phone = $("#loginModal #phone").val();
    phone = phone.replace(/[\s()-+]/g, "");

    // Primeiro verifica se o telefone existe
    fetch(`${BASE_API_URL}/api/auth/check-phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    })
      .then((res) => res.json())
      .then((resp) => {
        if (resp.exists) {
          // Se existe, faz login
          return fetch(`${BASE_API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone }),
          }).then((res) => res.json());
        } else {
          // Se não existe, abre modal de cadastro
          $("#cadastroModal #phone").val(phone);
          $("#openCadastro").click();
          $(".btn-close").click(); // Fecha modal de login
          return Promise.reject("user_not_found");
        }
      })
      .then((resp) => {
        if (resp.status === "success") {
          // Armazena o token JWT
          localStorage.setItem("authToken", resp.token);
          $(".btn-close").click();
          $("#overlay").fadeIn(300);
          setTimeout(function () {
            $("#add_to_cart").click();
          }, 1000);
        } else {
          console.log(resp.error || "Ocorreu um erro ao fazer login");
        }
      })
      .catch((err) => {
        if (err === "user_not_found") return; // Ignora erro quando usuário não existe
        console.error(err);
        console.log("Ocorreu um erro ao fazer login");
      });
  });
});

function formatarTEL(e) {
  let v = e.value;

  // Remove tudo que não é número
  v = v.replace(/\D/g, "");

  // Se não começar com +55, adiciona
  if (!v.startsWith("55")) {
    v = "55" + v;
  }

  // Formata o número no padrão internacional
  if (v.length > 2) {
    v = "+" + v.substring(0, 2) + v.substring(2);
  }

  if (v.length > 4) {
    v = v.substring(0, 4) + v.substring(4).replace(/^(\d{2})(\d)/g, "$1$2");
  }

  if (v.length > 12) {
    v = v.substring(0, 12) + v.substring(12).replace(/(\d{4})(\d)/, "$1-$2");
  }

  // Limita ao tamanho máximo (formato: +55DDxxxxxxxxx)
  if (v.length > 14) {
    v = v.substring(0, 14);
  }

  e.value = v;

  // Valida o formato
  const isValid = /^\+55\d{2}\d{4,5}\-?\d{4}$/.test(v);
  e.setCustomValidity(isValid ? "" : "Formato inválido. Use: +55DDxxxxxxxxx");
}

function formatarCPF(r) {
  var e = (r = r.replace(/\D/g, "")).replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
  document.getElementById("cpf").value = e;
}

function copyPix() {
  var copyText = document.getElementById("affiliate_url");

  copyText.select();
  copyText.setSelectionRange(0, 99999);

  document.execCommand("copy");
  navigator.clipboard.writeText(copyText.value);

  console.log("Link copiado com sucesso");
}
$(document).ready(function () {
  var cotas_array =
    "000000:500:premiada,111111:500:premiada,222222:500:premiada,333333:500:premiada,444444:500:premiada,555555:500:premiada,666666:500:premiada,777777:500:premiada,888888:500:premiada,999999:500:premiada,101010:500:premiada,202020:500:premiada,303030:500:premiada,404040:500:premiada,505050:500:premiada,606060:500:premiada,707070:500:premiada,808080:500:premiada,909090:500:premiada,202501:500:premiada";
  var product_id = parseInt("6990bd5a-a943-414e-bd8d-104047da60c8");
  var cotas_premiadas =
    "000000,111111,222222,333333,444444,555555,666666,777777,888888,999999,101010,202020,303030,404040,505050,606060,707070,808080,909090,202501";
  var $quantidade_auto_cota = "0";

  fetch(`${BASE_API_URL}/api/raffles/load-cotas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id,
      cotas_premiadas,
      cotas_array,
      quantidade_auto_cota: $quantidade_auto_cota,
    }),
  })
    .then((res) => res.json())
    .then((response) => {
      var cotas = response.html.split('<div class="hr"></div>');
      var cotas_premiadas = cotas.slice(0, 3).join('<div class="hr"></div>');
      $("#cotas-container").html(cotas_premiadas);
      $(".cotas_modal").html(response.html);
    })
    .catch((error) => {
      console.error("Erro:", error);
      $("#cotas-container").html("<p>Erro ao carregar as cotas.</p>");
    });
});
window.onload = function () {
  setTimeout(() => {
    const shimmerElement = document.querySelector(".app-shimmer");
    if (shimmerElement) {
      shimmerElement.classList.remove("app-shimmer");
    }
  }, 1000);
};

$(function () {
  $("#add_to_cart").click(function () {
    add_cart();
  });
  $("#place_order").click(function () {
    var ref = $(this).attr("data-id");
    place_order(ref);
  });

  $(".addNumero").click(function () {
    let value = parseInt($(".qty").val());
    value++;
    $(".qty").val(value);

    calculatePrice(value);
  });

  $(".removeNumero").click(function () {
    let value = parseInt($(".qty").val());
    if (value <= 1) {
      value = 1;
    } else {
      value--;
    }
    $(".qty").val(value);
    calculatePrice(value);
  });

  function checkPaymentStatus(orderRef) {
    fetch(`${BASE_API_URL}/api/checkout/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_ref: orderRef }),
    })
      .then((res) => res.json())
      .then((resp) => {
        if (resp.status === "success") {
          if (resp.order.status === "paid") {
            // Pagamento aprovado - mostrar números
            showOrderNumbers(resp.order);
          } else {
            // Continuar verificando
            setTimeout(() => checkPaymentStatus(orderRef), 5000);
          }
        } else {
          console.log(resp.error || "Erro ao verificar status do pagamento");
        }
      })
      .catch((err) => {
        console.error("Erro:", err);
        console.log("Erro ao verificar status do pagamento");
      });
  }

  function showOrderNumbers(order) {
    let numbersHtml = "";
    order.items.forEach((item) => {
      numbersHtml += `
        <div class="alert alert-success">
          <h5>Seus números:</h5>
          <p>${item.numbers.join(", ")}</p>
        </div>
      `;
    });

    $("#payment-status")
      .html(numbersHtml)
      .removeClass("alert-warning")
      .addClass("alert-success");

    $("#overlay").fadeOut(300);
  }
});
function formatCurrency(total) {
  var decimalSeparator = ",";
  var thousandsSeparator = ".";

  var formattedTotal = total.toFixed(2); // Define 2 casas decimais

  // Substitui o ponto pelo separador decimal desejado
  formattedTotal = formattedTotal.replace(".", decimalSeparator);

  // Formata o separador de milhar
  var parts = formattedTotal.split(decimalSeparator);
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  // Retorna o valor formatado
  return parts.join(decimalSeparator);
}

function calculatePrice(qty) {
  let price = "0.16";
  let enable_sale = parseInt("0");
  let sale_qty = parseInt("0");
  let sale_price = "0.00";

  let available = parseInt("959736");
  let total = price * qty;
  var max = parseInt("10000");
  var min = parseInt("25");

  if (qty > available) {
    //calculatePrice(available);
    //console.log('Há apenas : ' + available + ' cotas disponíveis no momento.');
    $(".aviso-content").html(
      "Restam apenas " + available + " cotas disponíveis no momento."
    );
    $("#aviso_sorteio").click();
    $(".qty").val(available);
    //total = price * available;
    //$('#total').html('R$ '+formatCurrency(total)+'');
    calculatePrice(available);
    return;
  }

  if (qty < min) {
    // calculatePrice(min);
    //console.log('A quantidade mínima de cotas é de: ' + min + '');
    $(".aviso-content").html("A quantidade mínima de cotas é de: " + min + "");
    //$('#aviso_sorteio').click();
    $(".qty").val(min);
    total = price * min;
    calculatePrice(min);
    //$('#total').html('R$ '+formatCurrency(total)+'');
    return;
  }

  if (qty > max) {
    //console.log('A quantidade máxima de cotas é de: ' + max + '');
    $(".aviso-content").html("A quantidade máxima de cotas é de: " + max + "");
    //$('#aviso_sorteio').click();
    $(".qty").val(max);
    total = price * max;
    calculatePrice(max);
    //$('#total').html('R$ '+formatCurrency(total)+'');
    return;
  }
  // Desconto acumulativo
  var qtd_desconto = parseInt("0");

  let dropeDescontos = [];
  for (i = 0; i < qtd_desconto; i++) {
    dropeDescontos[i] = {
      qtd: parseInt($(`#discount_qty_${i}`).text()),
      vlr: parseFloat($(`#discount_amount_${i}`).text()),
    };
  }
  //console.log(dropeDescontos);

  var drope_desconto_qty = null;
  var drope_desconto = null;

  for (i = 0; i < dropeDescontos.length; i++) {
    if (qty >= dropeDescontos[i].qtd) {
      drope_desconto_qty = dropeDescontos[i].qtd;
      drope_desconto = dropeDescontos[i].vlr;
    }
  }

  var drope_desconto_aplicado = total;
  var desconto_acumulativo = false;
  var quantidade_de_numeros = drope_desconto_qty;
  var valor_do_desconto = drope_desconto;

  if (desconto_acumulativo && qty >= quantidade_de_numeros) {
    var multiplicador_do_desconto = Math.floor(qty / quantidade_de_numeros);
    drope_desconto_aplicado =
      total - valor_do_desconto * multiplicador_do_desconto;
  }

  // Aplicar desconto normal quando desconto acumulativo estiver desativado
  if (!desconto_acumulativo && qty >= drope_desconto_qty) {
    drope_desconto_aplicado = total - valor_do_desconto;
  }

  if (parseInt(qty) >= parseInt(drope_desconto_qty)) {
    $("#total").html(
      "De <strike>R$ " +
        formatCurrency(total) +
        "</strike> por R$ " +
        formatCurrency(drope_desconto_aplicado)
    );
  } else {
    if (enable_sale == 1 && qty >= sale_qty) {
      total_sale = qty * sale_price;

      $("#total").html(
        "De <strike>R$ " +
          formatCurrency(total) +
          "</strike> por R$ " +
          formatCurrency(total_sale)
      );
    } else {
      $("#total").html("R$ " + formatCurrency(total));
    }
  }
  //Fim desconto acumulativo
}

function qtyRaffle(qty, opt) {
  qty = parseInt(qty);
  let value = parseInt($(".qty").val());
  let qtyTotal = value + qty;
  if (opt === true) {
    qtyTotal = qtyTotal - value;
  }

  $(".qty").val(qtyTotal);
  calculatePrice(qtyTotal);
}
function add_cart() {
  let qty = parseInt($(".qty").val());
  $("#qty_cotas").text(qty);

  // Verifica se o usuário está logado
  const token = localStorage.getItem("authToken");
  if (!token) {
    $("#loginModal").modal("show");
    return;
  }

  return fetch(`${BASE_API_URL}/api/cart/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      product_id: "6990bd5a-a943-414e-bd8d-104047da60c8",
      qty: qty,
    }),
  })
    .then((res) => res.json())
    .then((resp) => {
      if (resp.status === "success") {
        // Processa o pagamento imediatamente
        return place_order(resp.order.id);
      } else if (resp.msg) {
        console.log(resp.msg);
      } else {
        console.log("Ocorreu um erro ao adicionar ao carrinho");
      }
    })
    .catch((err) => {
      console.error("Erro:", err);
      console.log("Ocorreu um erro ao adicionar ao carrinho");
    });
}

$(document).ready(function () {
  $(".qty").on("keyup", function () {
    var value = parseInt($(this).val());
    var min = parseInt("25");
    var max = parseInt("10000");
    if (value < min) {
      calculatePrice(min);
      //console.log('A quantidade mínima de cotas é de: ' + min + '');
      $(".aviso-content").html(
        "A quantidade mínima de cotas é de: " + min + ""
      );
      $("#aviso_sorteio").click();
      $(".qty").val(min);
    }
    if (value > max) {
      calculatePrice(max);
      //console.log('A quantidade máxima de cotas é de: ' + max + '');
      $(".aviso-content").html(
        "A quantidade máxima de cotas é de: " + max + ""
      );
      $("#aviso_sorteio").click();
      $(".qty").val(max);
    }
  });
});

$(document).ready(function () {
  $("#consultMyNumbers").submit(function (e) {
    e.preventDefault();
    const phone = $(this).find('input[name="phone"]').val();

    fetch(`${BASE_API_URL}/api/orders/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    })
      .then((res) => res.json())
      .then((resp) => {
        if (resp.status === "success") {
          // location.href = resp.redirect;
        } else {
          console.log(resp.msg || "Nenhum registro de compra foi encontrado");
        }
      })
      .catch((err) => {
        console.error("Erro:", err);
        console.log("Ocorreu um erro ao buscar os números");
      });
  });
});

// Função para processar o pedido
async function place_order(orderId) {
  try {
    $("#overlay").fadeIn(300);

    // Verifica se o usuário está logado
    const token = localStorage.getItem("authToken");
    if (!token) {
      $("#loginModal").modal("show");
      $("#overlay").fadeOut(300);
      return;
    }

    // Processa o pagamento
    const response = await fetch(`${BASE_API_URL}/api/checkout/process`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        payment_method: "pix",
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      // Redireciona para a página de pagamento
      window.location.href = data.redirect_url;
    } else {
      console.log(data.error || "Ocorreu um erro ao processar o pedido");
      $("#overlay").fadeOut(300);
    }
  } catch (error) {
    console.error("Erro:", error);
    console.log("Ocorreu um erro ao processar o pedido");
    $("#overlay").fadeOut(300);
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}
