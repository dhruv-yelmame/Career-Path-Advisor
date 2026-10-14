package com.career.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class YesNoBooleanConverter implements AttributeConverter<Boolean, String> {

    @Override
    public String convertToDatabaseColumn(Boolean attribute) {
        if (attribute == null) {
            return "NO";
        }
        return attribute ? "YES" : "NO";
    }

    @Override
    public Boolean convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return false;
        }
        String clean = dbData.trim().toUpperCase();
        return clean.equals("YES") || clean.equals("Y") || clean.equals("1") || clean.equals("TRUE");
    }
}
