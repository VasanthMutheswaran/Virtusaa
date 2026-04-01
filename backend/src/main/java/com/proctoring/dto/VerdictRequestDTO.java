package com.proctoring.dto;

import lombok.Data;

public class VerdictRequestDTO {
    private String verdict;

    public VerdictRequestDTO() {
    }

    public String getVerdict() {
        return verdict;
    }

    public void setVerdict(String verdict) {
        this.verdict = verdict;
    }
}
