document.addEventListener("DOMContentLoaded", () => {
  const addProcessBtn = document.getElementById("add-process-btn");
  const calculateBtn = document.getElementById("calculate-btn");
  const processTableBody = document.getElementById("process-table-body");
  const algorithmSelect = document.getElementById("algorithm-select");
  const timeQuantumContainer = document.getElementById(
    "time-quantum-container"
  );
  let processIdCounter = 1;

  algorithmSelect.addEventListener("change", () => {
    const showQuantum = algorithmSelect.value === "rr";
    timeQuantumContainer.style.display = showQuantum ? "flex" : "none";
  });

  // --- FUNGSI DIPERBARUI ---
  function addProcessRow() {
    const row = document.createElement("tr");
    const currentId = processIdCounter++;
    // Tambahkan atribut data-label pada setiap <td>
    row.innerHTML = `
        <td data-label="ID Proses">P${currentId}</td>
        <td data-label="Arrival Time"><input type="number" class="arrival-time" value="0" min="0"></td>
        <td data-label="Burst Time"><input type="number" class="burst-time" value="1" min="1"></td>
        <td data-label="Prioritas"><input type="number" class="priority" value="0" min="0"></td>
        <td data-label="Aksi"><button class="btn-delete">Hapus</button></td>
    `;
    processTableBody.appendChild(row);
    row
      .querySelector(".btn-delete")
      .addEventListener("click", () => row.remove());
  }

  ["", "", ""].forEach(addProcessRow);
  addProcessBtn.addEventListener("click", addProcessRow);
  calculateBtn.addEventListener("click", main);

  function main() {
    let isValid = true;
    const processes = [];
    const rows = processTableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      const id = row.children[0].textContent;
      const arrivalInput = row.querySelector(".arrival-time");
      const burstInput = row.querySelector(".burst-time");
      const priorityInput = row.querySelector(".priority"); // Ambil input prioritas

      const arrival = parseInt(arrivalInput.value);
      const burst = parseInt(burstInput.value);
      const priority = parseInt(priorityInput.value); // Ambil nilai prioritas

      // Validasi semua input
      if (
        isNaN(arrival) ||
        isNaN(burst) ||
        isNaN(priority) ||
        arrival < 0 ||
        burst <= 0 ||
        priority < 0
      ) {
        isValid = false;
        [arrivalInput, burstInput, priorityInput].forEach(
          (input) => (input.style.borderColor = "red")
        );
      } else {
        [arrivalInput, burstInput, priorityInput].forEach(
          (input) => (input.style.borderColor = "#ccc")
        );
        processes.push({
          id,
          arrival,
          burst,
          priority,
          originalBurst: burst,
          remainingBurst: burst,
          originalIndex: processes.length,
        });
      }
    });

    if (!isValid) {
      alert(
        "Input tidak valid! Pastikan semua field terisi dengan angka positif (Burst Time > 0)."
      );
      return;
    }

    if (processes.length === 0) {
      alert("Silakan tambahkan setidaknya satu proses.");
      return;
    }

    const selectedAlgorithm = algorithmSelect.value;
    let results;
    switch (selectedAlgorithm) {
      case "fcfs":
        results = runFCFS(processes);
        break;
      case "sjf_non_preemptive":
        results = runSJFNonPreemptive(processes);
        break;
      case "sjf_preemptive":
        results = runSJFPreemptive(processes);
        break;
      case "priority_non_preemptive":
        results = runPriorityNonPreemptive(processes);
        break; // ALGORITMA BARU
      case "priority_preemptive":
        results = runPriorityPreemptive(processes);
        break; // ALGORITMA BARU
      case "rr":
        const quantum = parseInt(document.getElementById("time-quantum").value);
        if (isNaN(quantum) || quantum <= 0) {
          alert("Time Quantum harus berupa angka positif.");
          return;
        }
        results = runRR(processes, quantum);
        break;
      default:
        alert("Algoritma tidak valid!");
        return;
    }
    displayResults(results);
  }

  // ===============================================
  // IMPLEMENTASI ALGORITMA
  // ===============================================

  function runFCFS(procs) {
    /* ... (tidak ada perubahan) ... */
    const processes = JSON.parse(JSON.stringify(procs));
    processes.sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0,
      gantt = [];
    processes.forEach((p) => {
      if (currentTime < p.arrival) {
        gantt.push({ id: "Idle", start: currentTime, end: p.arrival });
        currentTime = p.arrival;
      }
      p.completionTime = currentTime + p.burst;
      p.turnaroundTime = p.completionTime - p.arrival;
      p.waitingTime = p.turnaroundTime - p.burst;
      gantt.push({ id: p.id, start: currentTime, end: p.completionTime });
      currentTime = p.completionTime;
    });
    return { processes, gantt };
  }

  function runSJFNonPreemptive(procs) {
    /* ... (tidak ada perubahan) ... */
    const processes = JSON.parse(JSON.stringify(procs));
    let currentTime = 0,
      gantt = [],
      completed = 0;
    const n = processes.length;
    while (completed < n) {
      const readyQueue = processes.filter(
        (p) => !p.completionTime && p.arrival <= currentTime
      );
      if (readyQueue.length === 0) {
        const nextArrival = Math.min(
          ...processes.filter((p) => !p.completionTime).map((p) => p.arrival)
        );
        if (nextArrival > currentTime) {
          gantt.push({ id: "Idle", start: currentTime, end: nextArrival });
          currentTime = nextArrival;
        }
        continue;
      }
      readyQueue.sort((a, b) => a.burst - b.burst);
      const p = readyQueue[0];
      p.completionTime = currentTime + p.burst;
      p.turnaroundTime = p.completionTime - p.arrival;
      p.waitingTime = p.turnaroundTime - p.burst;
      gantt.push({ id: p.id, start: currentTime, end: p.completionTime });
      currentTime = p.completionTime;
      completed++;
    }
    return { processes, gantt };
  }

  function runSJFPreemptive(procs) {
    /* ... (tidak ada perubahan) ... */
    const processes = JSON.parse(JSON.stringify(procs));
    let currentTime = 0,
      gantt = [],
      completed = 0;
    const n = processes.length;
    while (completed < n) {
      const readyQueue = processes.filter(
        (p) => p.arrival <= currentTime && p.remainingBurst > 0
      );
      if (readyQueue.length === 0) {
        const nextArrival = Math.min(
          ...processes.filter((p) => p.remainingBurst > 0).map((p) => p.arrival)
        );
        if (nextArrival > currentTime) {
          gantt.push({ id: "Idle", start: currentTime, end: nextArrival });
          currentTime = nextArrival;
        }
        continue;
      }
      readyQueue.sort((a, b) => a.remainingBurst - b.remainingBurst);
      const p = readyQueue[0];
      const lastGantt = gantt[gantt.length - 1];
      if (lastGantt && lastGantt.id === p.id) {
        lastGantt.end++;
      } else {
        gantt.push({ id: p.id, start: currentTime, end: currentTime + 1 });
      }
      p.remainingBurst--;
      currentTime++;
      if (p.remainingBurst === 0) {
        p.completionTime = currentTime;
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.burst;
        completed++;
      }
    }
    return { processes, gantt };
  }

  /**
   * FUNGSI BARU: Menjalankan algoritma Priority Non-Preemptive.
   * Konvensi: Angka prioritas lebih kecil = prioritas lebih tinggi.
   */
  function runPriorityNonPreemptive(procs) {
    const processes = JSON.parse(JSON.stringify(procs));
    let currentTime = 0,
      gantt = [],
      completed = 0;
    const n = processes.length;
    while (completed < n) {
      const readyQueue = processes.filter(
        (p) => !p.completionTime && p.arrival <= currentTime
      );
      if (readyQueue.length === 0) {
        const nextArrival = Math.min(
          ...processes.filter((p) => !p.completionTime).map((p) => p.arrival)
        );
        if (nextArrival > currentTime) {
          gantt.push({ id: "Idle", start: currentTime, end: nextArrival });
          currentTime = nextArrival;
        }
        continue;
      }
      // Urutkan berdasarkan prioritas (angka lebih kecil lebih tinggi)
      readyQueue.sort((a, b) => a.priority - b.priority);
      const p = readyQueue[0];
      p.completionTime = currentTime + p.burst;
      p.turnaroundTime = p.completionTime - p.arrival;
      p.waitingTime = p.turnaroundTime - p.burst;
      gantt.push({ id: p.id, start: currentTime, end: p.completionTime });
      currentTime = p.completionTime;
      completed++;
    }
    return { processes, gantt };
  }

  /**
   * FUNGSI BARU: Menjalankan algoritma Priority Preemptive.
   */
  function runPriorityPreemptive(procs) {
    const processes = JSON.parse(JSON.stringify(procs));
    let currentTime = 0,
      gantt = [],
      completed = 0;
    const n = processes.length;
    while (completed < n) {
      const readyQueue = processes.filter(
        (p) => p.arrival <= currentTime && p.remainingBurst > 0
      );
      if (readyQueue.length === 0) {
        const nextArrival = Math.min(
          ...processes.filter((p) => p.remainingBurst > 0).map((p) => p.arrival)
        );
        if (nextArrival > currentTime) {
          gantt.push({ id: "Idle", start: currentTime, end: nextArrival });
          currentTime = nextArrival;
        }
        continue;
      }
      // Urutkan berdasarkan prioritas untuk preemption
      readyQueue.sort((a, b) => a.priority - b.priority);
      const p = readyQueue[0];
      const lastGantt = gantt[gantt.length - 1];
      if (lastGantt && lastGantt.id === p.id) {
        lastGantt.end++;
      } else {
        gantt.push({ id: p.id, start: currentTime, end: currentTime + 1 });
      }
      p.remainingBurst--;
      currentTime++;
      if (p.remainingBurst === 0) {
        p.completionTime = currentTime;
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.burst;
        completed++;
      }
    }
    return { processes, gantt };
  }

  function runRR(procs, quantum) {
    /* ... (tidak ada perubahan) ... */
    const processes = JSON.parse(JSON.stringify(procs));
    processes.sort((a, b) => a.arrival - b.arrival);
    const readyQueue = [];
    let currentTime = 0,
      gantt = [],
      processIndex = 0;
    const n = processes.length;

    while (processIndex < n || readyQueue.length > 0) {
      while (
        processIndex < n &&
        processes[processIndex].arrival <= currentTime
      ) {
        readyQueue.push(processes[processIndex]);
        processIndex++;
      }
      if (readyQueue.length === 0) {
        const nextArrival = processes[processIndex].arrival;
        gantt.push({ id: "Idle", start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        continue;
      }
      const p = readyQueue.shift();
      const executionTime = Math.min(p.remainingBurst, quantum);
      gantt.push({
        id: p.id,
        start: currentTime,
        end: currentTime + executionTime,
      });
      p.remainingBurst -= executionTime;
      currentTime += executionTime;

      while (
        processIndex < n &&
        processes[processIndex].arrival <= currentTime
      ) {
        readyQueue.push(processes[processIndex]);
        processIndex++;
      }

      if (p.remainingBurst > 0) {
        readyQueue.push(p);
      } else {
        p.completionTime = currentTime;
        p.turnaroundTime = p.completionTime - p.arrival;
        p.waitingTime = p.turnaroundTime - p.originalBurst;
      }
    }
    return { processes, gantt };
  }

  // ===============================================
  // FUNGSI UNTUK MENAMPILKAN HASIL
  // ===============================================
  function displayResults(results) {
    /* ... (tidak ada perubahan) ... */
    document.getElementById("results").style.display = "block";
    results.processes.sort((a, b) => a.originalIndex - b.originalIndex);
    displayGanttChart(results.gantt);
    displayCalculationDetails(results.processes);
    displayResultsTable(results.processes);

    const validProcesses = results.processes.filter(
      (p) => p.turnaroundTime !== undefined
    );
    const turnaroundTimes = validProcesses.map((p) => p.turnaroundTime);
    const waitingTimes = validProcesses.map((p) => p.waitingTime);
    const processCount = validProcesses.length;

    if (processCount > 0) {
      const totalTurnaround = turnaroundTimes.reduce(
        (sum, val) => sum + val,
        0
      );
      const totalWaiting = waitingTimes.reduce((sum, val) => sum + val, 0);
      const avgTurnaround = (totalTurnaround / processCount).toFixed(2);
      const avgWaiting = (totalWaiting / processCount).toFixed(2);
      document.getElementById(
        "avg-turnaround-time"
      ).innerHTML = `( ${turnaroundTimes.join(
        " + "
      )} ) / ${processCount} = <strong>${avgTurnaround}</strong>`;
      document.getElementById(
        "avg-waiting-time"
      ).innerHTML = `( ${waitingTimes.join(
        " + "
      )} ) / ${processCount} = <strong>${avgWaiting}</strong>`;
    }
  }

  function displayCalculationDetails(processes) {
    /* ... (tidak ada perubahan) ... */
    const detailsContainer = document.getElementById("calculation-details");
    const tatCalcsList = document.getElementById("turnaround-time-calcs");
    const wtCalcsList = document.getElementById("waiting-time-calcs");
    detailsContainer.style.display = "block";
    tatCalcsList.innerHTML = "";
    wtCalcsList.innerHTML = "";
    processes.forEach((p) => {
      const tatLi = document.createElement("li");
      tatLi.innerHTML = `<strong>${p.id}:</strong> ${p.completionTime} (Completion) - ${p.arrival} (Arrival) = <strong>${p.turnaroundTime}</strong>`;
      tatCalcsList.appendChild(tatLi);
      const wtLi = document.createElement("li");
      wtLi.innerHTML = `<strong>${p.turnaroundTime}</strong> (Turnaround) - ${p.originalBurst} (Burst) = <strong>${p.waitingTime}</strong>`;
      wtCalcsList.appendChild(wtLi);
    });
  }

  function displayGanttChart(gantt) {
    /* ... (tidak ada perubahan) ... */
    const container = document.getElementById("gantt-chart-container");
    container.innerHTML = "";
    const totalDuration = gantt.length > 0 ? gantt[gantt.length - 1].end : 0;
    if (totalDuration === 0) return;
    const colors = [
      "#2980b9",
      "#c0392b",
      "#27ae60",
      "#f39c12",
      "#8e44ad",
      "#d35400",
    ];
    gantt.forEach((block, index) => {
      const blockDiv = document.createElement("div");
      const duration = block.end - block.start;
      blockDiv.className = `gantt-block ${block.id === "Idle" ? "idle" : ""}`;
      blockDiv.style.width = `${(duration / totalDuration) * 100}%`;
      blockDiv.title = `Proses: ${block.id}\nMulai: ${block.start}\nSelesai: ${block.end}\nDurasi: ${duration}`;

      if (block.id !== "Idle") {
        const colorIndex = parseInt(block.id.substring(1)) - 1;
        blockDiv.style.backgroundColor = colors[colorIndex % colors.length];
      }

      blockDiv.innerHTML = `<span class="process-id">${block.id}</span><span class="time-stamp">${block.start}</span>`;
      if (index === gantt.length - 1) {
        blockDiv.innerHTML += `<span class="time-stamp-end">${block.end}</span>`;
      }
      container.appendChild(blockDiv);
    });
  }

  // Perbarui fungsi ini untuk menampilkan kolom prioritas
  function displayResultsTable(processes) {
    const tableBody = document.getElementById("results-table-body");
    tableBody.innerHTML = "";
    processes.forEach((p) => {
      const row = document.createElement("tr");
      // Tambahkan atribut data-label pada setiap <td>
      row.innerHTML = `
            <td data-label="ID Proses">${p.id}</td>
            <td data-label="Arrival Time">${p.arrival}</td>
            <td data-label="Burst Time">${p.originalBurst}</td>
            <td data-label="Prioritas">${p.priority}</td>
            <td data-label="Turnaround Time">${p.turnaroundTime}</td>
            <td data-label="Waiting Time">${p.waitingTime}</td>
        `;
      tableBody.appendChild(row);
    });
  }
});
