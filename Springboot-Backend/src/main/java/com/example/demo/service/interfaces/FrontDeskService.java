package com.example.demo.service.interfaces;

import com.example.demo.dto.FrontDeskBoard;

public interface FrontDeskService {
    /** Arma el tablero del día: llegadas, alojados, salidas pendientes y habitaciones por preparar. */
    FrontDeskBoard readBoard();
}
